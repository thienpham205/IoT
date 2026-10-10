import mqtt from 'mqtt'
import 'dotenv/config'

let client = null
let sensorInterval = null
let heartbeatInterval = null

// Trạng thái đèn giả lập
const deviceStates = {
  LIGHT_01: 'OFF'
}

let currentTemp = 28.5
let currentHumidity = 62.0
let currentLight = 420

export function startSimulator() {
  if (process.env.ENABLE_SIMULATOR === 'false') {
    console.log('[simulator] Disabled via ENABLE_SIMULATOR=false')
    return null
  }

  const brokerUrl = process.env.MQTT_URL || 'mqtt://127.0.0.1:1883'
  client = mqtt.connect(brokerUrl, {
    username: process.env.MQTT_USERNAME || 'thien',
    password: process.env.MQTT_PASSWORD || '123',
    clientId: `esp8266-virtual-${Math.random().toString(16).slice(2)}`,
    reconnectPeriod: 3000
  })

  client.on('connect', () => {
    console.log('[simulator] Virtual ESP8266 connected to MQTT broker')
    client.subscribe('iot/devices/+/command', { qos: 1 })

    // Bắt đầu chu kỳ gửi cảm biến mỗi 2 giây giống sketch_aug29a.ino
    if (!sensorInterval) {
      sensorInterval = setInterval(publishSimulatedSensorData, 2000)
    }

    // Bắt đầu heartbeat mỗi 30 giây
    if (!heartbeatInterval) {
      heartbeatInterval = setInterval(publishSimulatedHeartbeat, 30000)
    }
  })

  client.on('message', (topic, payloadBuf) => {
    try {
      const raw = payloadBuf.toString()
      const data = JSON.parse(raw)
      const topicParts = topic.split('/')
      const deviceCode = data.deviceCode || topicParts[2] || 'LIGHT_01'
      const { actionCode, action } = data

      if (!action || !['ON', 'OFF'].includes(action.toUpperCase())) {
        return
      }

      const normalizedAction = action.toUpperCase()
      deviceStates[deviceCode] = normalizedAction

      console.log(`[simulator] ESP8266 received command [${normalizedAction}] for [${deviceCode}], actionCode: ${actionCode}`)

      // Gửi ACK về topic status giống hệt hàm publishStatus() trong firmware ESP8266
      const ackPayload = JSON.stringify({
        actionCode: actionCode || '',
        deviceCode,
        status: normalizedAction,
        result: 'SUCCESS',
        confirmedAt: new Date().toISOString()
      })

      const statusTopic = `iot/devices/${deviceCode}/status`
      client.publish(statusTopic, ackPayload, { qos: 1 }, (err) => {
        if (err) {
          console.error(`[simulator] Failed to publish ACK to ${statusTopic}:`, err.message)
        } else {
          console.log(`[simulator] Sent ACK SUCCESS to ${statusTopic} (status: ${normalizedAction})`)
        }
      })
    } catch (err) {
      console.error('[simulator] Error handling command message:', err.message)
    }
  })

  client.on('error', (err) => {
    console.error('[simulator] MQTT error:', err.message)
  })

  return client
}

function publishSimulatedSensorData() {
  if (!client || !client.connected) return

  // Dao động nhẹ giá trị nhiệt độ, độ ẩm, ánh sáng cho tự nhiên
  currentTemp += (Math.random() - 0.5) * 0.4
  currentTemp = Math.min(32, Math.max(26, currentTemp))

  currentHumidity += (Math.random() - 0.5) * 0.8
  currentHumidity = Math.min(75, Math.max(50, currentHumidity))

  currentLight += Math.round((Math.random() - 0.5) * 20)
  currentLight = Math.min(700, Math.max(250, currentLight))

  const payload = JSON.stringify({
    sensorCode: 'SENSOR_01',
    temperature: Number(currentTemp.toFixed(1)),
    humidity: Number(currentHumidity.toFixed(1)),
    light: currentLight,
    timestamp: new Date().toISOString()
  })

  client.publish('iot/sensors/SENSOR_01/data', payload, { qos: 1 }, (err) => {
    if (err) {
      console.error('[simulator] Failed to publish sensor data:', err.message)
    }
  })
}

function publishSimulatedHeartbeat() {
  if (!client || !client.connected) return

  const payload = JSON.stringify({
    nodeId: 'esp8266-01',
    timestamp: new Date().toISOString()
  })

  client.publish('iot/nodes/esp8266-01/heartbeat', payload, { qos: 0 })
}

export function stopSimulator() {
  if (sensorInterval) {
    clearInterval(sensorInterval)
    sensorInterval = null
  }
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval)
    heartbeatInterval = null
  }
  if (client) {
    client.end()
    client = null
  }
}
