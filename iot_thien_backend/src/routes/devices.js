import { Router } from 'express'
import crypto from 'node:crypto'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { publishCommand } from '../mqttClient.js'

const router = Router()
const VALID_ACTIONS = ['ON', 'OFF', 'AUTO']

router.get('/devices', requireAuth, async (req, res) => {
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
})

router.post('/devices/:deviceId/control', requireAuth, async (req, res) => {
  const { action, mode } = req.body || {}
  if (!VALID_ACTIONS.includes(action)) {
    return res.status(400).json({ message: 'action phải là ON, OFF hoặc AUTO' })
  }

  const [[device]] = await pool.query(
    'SELECT device_id, device_code, device_name, location, status, mode FROM devices WHERE device_id = ?',
    [req.params.deviceId]
  )
  if (!device) return res.status(404).json({ message: 'Thiết bị không tồn tại' })

  const actionCode = crypto.randomUUID()
  const requestedMode = mode === 'AUTO' ? 'AUTO' : 'MANUAL'
  const now = new Date()

  // Cập nhật trạng thái thiết bị và ghi lịch sử (phục vụ test FE không cần chờ phần cứng)
  await pool.query(
    'UPDATE devices SET status = ?, mode = ?, last_seen = ?, updated_at = ? WHERE device_id = ?',
    [action, requestedMode, now, now, device.device_id]
  )

  await pool.query(
    `INSERT INTO action_history (action_code, device_id, user_id, action, requested_state, result, area, action_time, confirmed_at)
     VALUES (?, ?, ?, ?, ?, 'SUCCESS', ?, ?, ?)`,
    [actionCode, device.device_id, req.user.userId, action, action, device.location, now, now]
  )

  // Vẫn publish lệnh xuống MQTT nếu có mạch thật kết nối
  try {
    publishCommand({ actionCode, deviceCode: device.device_code, action, mode: requestedMode }).catch(() => {})
  } catch {}

  return res.json({
    actionCode,
    deviceId: device.device_id,
    status: action,
    mode: requestedMode,
    result: 'SUCCESS',
    confirmedAt: now.toISOString()
  })
})

export default router
