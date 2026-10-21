import mqtt from 'mqtt'
import 'dotenv/config'
import { pool } from './db.js'

// Ngưỡng cảnh báo NORMAL/WARNING - dùng chung một quy tắc cho cả luồng MQTT
// và các phép tính thống kê, khớp với mô tả "so ngưỡng" ở Chương 2.7.
const THRESHOLDS = { tempMax: 32, tempMin: 15, humidityMax: 85, lightMax: 900 }

export function classifyStatus({ temperature, humidity, light }) {
  const warn =
    temperature > THRESHOLDS.tempMax ||
    temperature < THRESHOLDS.tempMin ||
    humidity > THRESHOLDS.humidityMax ||
    light > THRESHOLDS.lightMax
  return warn ? 'WARNING' : 'NORMAL'
}

const pendingActions = new Map() // actionCode -> { resolve, reject, timer, deviceCode }

let client = null

export function connectMqtt() {
  client = mqtt.connect(process.env.MQTT_URL, {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    clientId: `iot-thien-backend-${Math.random().toString(16).slice(2)}`,
    reconnectPeriod: 3000
  })

  client.on('connect', () => {
    console.log('[mqtt] connected to broker')
    client.subscribe(process.env.TOPIC_SENSOR_DATA, { qos: 1 })
    client.subscribe(process.env.TOPIC_DEVICE_STATUS, { qos: 1 })
    client.subscribe(process.env.TOPIC_HEARTBEAT, { qos: 0 })
  })

  client.on('reconnect', () => console.log('[mqtt] reconnecting...'))
  client.on('error', (err) => console.error('[mqtt] error:', err.message))

  client.on('message', async (topic, payloadBuf) => {
    const raw = payloadBuf.toString()
    try {
      if (matchTopic(topic, 'iot/sensors/+/data')) {
        await handleSensorData(raw)
      } else if (matchTopic(topic, 'iot/devices/+/status')) {
        await handleDeviceStatus(topic, raw)
      } else if (matchTopic(topic, 'iot/nodes/+/heartbeat')) {
        console.log(`[mqtt] heartbeat on ${topic}`)
      }
    } catch (err) {
      console.error(`[mqtt] failed to process message on ${topic}:`, err.message)
    }
  })

  return client
}

function matchTopic(topic, pattern) {
  const t = topic.split('/')
  const p = pattern.split('/')
  if (t.length !== p.length) return false
  return p.every((seg, i) => seg === '+' || seg === t[i])
}

async function handleSensorData(raw) {
  const payload = JSON.parse(raw)
  const { sensorCode, temperature, humidity, light, timestamp } = payload

  if (
    typeof sensorCode !== 'string' ||
    typeof temperature !== 'number' ||
    typeof humidity !== 'number' ||
    typeof light !== 'number'
  ) {
    console.warn('[mqtt] invalid sensor payload, ignored:', raw)
    return
  }
  if (temperature < -40 || temperature > 125 || humidity < 0 || humidity > 100 || light < 0) {
    console.warn('[mqtt] sensor payload out of range, ignored:', raw)
    return
  }

  const [[sensor]] = await pool.query('SELECT sensor_id FROM sensors WHERE sensor_code = ?', [sensorCode])
  if (!sensor) {
    console.warn(`[mqtt] unknown sensorCode "${sensorCode}", ignored`)
    return
  }

  const status = classifyStatus({ temperature, humidity, light })
  const recordedAt = timestamp ? new Date(timestamp) : new Date()

  await pool.query(
    'INSERT INTO sensor_data (sensor_id, temperature, humidity, light, status, recorded_at) VALUES (?, ?, ?, ?, ?, ?)',
    [sensor.sensor_id, temperature, humidity, light, status, recordedAt]
  )
}

async function handleDeviceStatus(topic, raw) {
  const payload = JSON.parse(raw)
  const deviceCodeFromTopic = topic.split('/')[2]
  const { actionCode, deviceCode = deviceCodeFromTopic, status, result } = payload

  if (!['ON', 'OFF'].includes(status)) {
    console.warn('[mqtt] invalid device status payload, ignored:', raw)
    return
  }

  const [[device]] = await pool.query('SELECT device_id FROM devices WHERE device_code = ?', [deviceCode])
  if (!device) {
    console.warn(`[mqtt] unknown deviceCode "${deviceCode}", ignored`)
    return
  }

  const now = new Date()
  await pool.query('UPDATE devices SET status = ?, last_seen = ?, updated_at = ? WHERE device_id = ?', [
    status,
    now,
    now,
    device.device_id
  ])

  const pending = actionCode ? pendingActions.get(actionCode) : null
  if (pending && pending.deviceCode === deviceCode) {
    clearTimeout(pending.timer)
    pendingActions.delete(actionCode)
    // Mạch gửi result = REJECTED khi không thực hiện được lệnh -> route ghi FAILED
    if (result && result !== 'SUCCESS') {
      pending.reject(new Error('REJECTED'))
      return
    }
    await pool.query('UPDATE action_history SET result = ?, confirmed_at = ? WHERE action_code = ?', [
      'SUCCESS',
      now,
      actionCode
    ])
    pending.resolve({ status, confirmedAt: now.toISOString() })
  }
}

// Publish lệnh điều khiển tới ESP8266 và chờ ACK trong CONTROL_ACK_TIMEOUT_MS.
// Nếu hết thời gian chờ, action_history được cập nhật FAILED (đúng luồng UC04).
export function publishCommand({ actionCode, deviceCode, action, mode }) {
  const topic = `${process.env.TOPIC_DEVICE_COMMAND_PREFIX}/${deviceCode}/command`
  const payload = JSON.stringify({
    actionCode,
    deviceCode,
    action,
    mode,
    requestedAt: new Date().toISOString()
  })

  // Đang mất kết nối Broker thì báo lỗi ngay; nếu không, thư viện mqtt sẽ xếp hàng lệnh
  // và gửi muộn khi kết nối lại (đèn tự đổi trạng thái dù người dùng đã thấy "Thất bại")
  if (!client || !client.connected) {
    return Promise.reject(new Error('MQTT_DISCONNECTED'))
  }

  return new Promise((resolve, reject) => {
    const timeoutMs = Number(process.env.CONTROL_ACK_TIMEOUT_MS || 5000)
    const timer = setTimeout(async () => {
      pendingActions.delete(actionCode)
      try {
        await pool.query('UPDATE action_history SET result = ? WHERE action_code = ?', ['FAILED', actionCode])
      } catch (err) {
        console.error('[mqtt] failed to mark FAILED after timeout:', err.message)
      }
      reject(new Error('ACK_TIMEOUT'))
    }, timeoutMs)

    pendingActions.set(actionCode, { resolve, reject, timer, deviceCode })

    client.publish(topic, payload, { qos: 1 }, (err) => {
      if (err) {
        clearTimeout(timer)
        pendingActions.delete(actionCode)
        reject(err)
      }
    })
  })
}
