import { Router } from 'express'
import crypto from 'node:crypto'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { asyncRoute } from '../utils/asyncRoute.js'
import { publishCommand } from '../mqttClient.js'

const router = Router()

const FAILED_MESSAGES = {
  ACK_TIMEOUT: 'Thiết bị không phản hồi',
  REJECTED: 'Thiết bị từ chối lệnh'
}
// Mạch ESP8266 chỉ xử lý lệnh ON/OFF (lệnh khác sẽ bị mạch từ chối)
const VALID_ACTIONS = ['ON', 'OFF']

router.get('/devices', requireAuth, asyncRoute(async (req, res) => {
  const [devices] = await pool.query(
    'SELECT device_id, device_code, device_name, device_type, location, status, mode, last_seen FROM devices ORDER BY device_id'
  )
  res.json({
    devices: devices.map((d) => ({
      deviceId: d.device_id,
      deviceCode: d.device_code,
      deviceName: d.device_name,
      deviceType: d.device_type,
      location: d.location,
      status: d.status,
      mode: d.mode,
      lastSeen: d.last_seen ? d.last_seen.toISOString() : null
    }))
  })
}))

router.post('/devices/:deviceId/control', requireAuth, asyncRoute(async (req, res) => {
  const { action, mode } = req.body || {}
  if (!VALID_ACTIONS.includes(action)) {
    return res.status(400).json({ message: 'action phải là ON hoặc OFF' })
  }

  const [[device]] = await pool.query(
    'SELECT device_id, device_code, device_name, location, status, mode FROM devices WHERE device_id = ?',
    [req.params.deviceId]
  )
  if (!device) return res.status(404).json({ message: 'Thiết bị không tồn tại' })

  const actionCode = crypto.randomUUID()
  const requestedMode = mode === 'AUTO' ? 'AUTO' : 'MANUAL'
  const now = new Date()

  // Ghi lịch sử với trạng thái PENDING, publish lệnh xuống ESP8266 rồi chờ ACK (luồng UC04):
  // có ACK -> mqttClient cập nhật devices + action_history = SUCCESS;
  // hết CONTROL_ACK_TIMEOUT_MS không có ACK -> action_history = FAILED, trạng thái đèn giữ nguyên.
  await pool.query(
    `INSERT INTO action_history (action_code, device_id, user_id, action, requested_state, result, area, action_time)
     VALUES (?, ?, ?, ?, ?, 'PENDING', ?, ?)`,
    [actionCode, device.device_id, req.user.userId, action, action, device.location, now]
  )

  // Chỉ bọc bước gửi lệnh / chờ ACK: lỗi khác (VD lỗi CSDL) đi tới middleware lỗi chung,
  // không bị báo nhầm là lỗi MQTT Broker
  let ack
  try {
    ack = await publishCommand({ actionCode, deviceCode: device.device_code, action, mode: requestedMode })
  } catch (err) {
    // Lỗi publish (mất kết nối Broker) thì timeout chưa kịp ghi FAILED, nên ghi ở đây
    await pool.query("UPDATE action_history SET result = 'FAILED' WHERE action_code = ?", [actionCode])
    return res.json({
      actionCode,
      deviceId: device.device_id,
      status: device.status,
      mode: device.mode,
      result: 'FAILED',
      message: FAILED_MESSAGES[err.message] || 'Không gửi được lệnh tới MQTT Broker'
    })
  }

  await pool.query('UPDATE devices SET mode = ? WHERE device_id = ?', [requestedMode, device.device_id])
  res.json({
    actionCode,
    deviceId: device.device_id,
    status: ack.status,
    mode: requestedMode,
    result: 'SUCCESS',
    confirmedAt: ack.confirmedAt
  })
}))

export default router
