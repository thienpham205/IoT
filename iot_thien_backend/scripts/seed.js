import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { pool } from '../src/db.js'

async function main() {
  const passwordHash = await bcrypt.hash('123456', 10)

  await pool.query(
    `INSERT INTO users (username, password_hash, full_name, student_id, email, role, github_link, figma_link, postman_link, pdf_link)
     VALUES (?, ?, ?, ?, ?, 'USER', ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), full_name = VALUES(full_name),
       github_link = VALUES(github_link), figma_link = VALUES(figma_link),
       postman_link = VALUES(postman_link), pdf_link = VALUES(pdf_link)`,
    [
      'phamminhthien',
      passwordHash,
      'Phạm Minh Thiện',
      'B23DCAT285',
      'phamminhthien@ptit.edu.vn',
      'https://github.com/thienpham205',
      'https://www.figma.com/design/FUkx7yZ5Nas3ofLx7wTZ9p/IOT_THIEN?node-id=2606-318&t=zmqpSwi2fBIHgSik-1',
      // 2 file tĩnh do frontend phục vụ (iot_thien_react_frontend/public/files)
      '/files/IOT_Thien_API.postman_collection.json',
      '/files/Pham_Minh_Thien_B23DCAT285_IOT_Report.pdf'
    ]
  )

  await pool.query(
    `INSERT INTO sensors (sensor_code, sensor_name, sensor_type, unit, location, status)
     VALUES ('SENSOR_01', 'Cảm biến phòng khách', 'DHT11 + Quang trở', 'C/%/lux', 'Phòng khách', 'ACTIVE')
     ON DUPLICATE KEY UPDATE sensor_name = VALUES(sensor_name)`
  )

  // LIGHT_01 khớp đúng device_code mà firmware ESP8266 (esp8266-01) hiện đang publish/subscribe
  // qua MQTT (relay/LED thật duy nhất trên chân D0). Không seed Quạt/Điều hòa vì chưa có relay
  // vật lý cho 2 thiết bị đó - tránh gây hiểu lầm khi hiển thị lên giao diện.
  const devices = [
    ['LIGHT_01', 'Đèn', 'LIGHT', 'Phòng khách']
  ]
  for (const [code, name, type, location] of devices) {
    await pool.query(
      `INSERT INTO devices (device_code, device_name, device_type, location, status, mode)
       VALUES (?, ?, ?, ?, 'OFF', 'MANUAL')
       ON DUPLICATE KEY UPDATE device_name = VALUES(device_name)`,
      [code, name, type, location]
    )
  }

  console.log('Seed hoàn tất: 1 user (phamminhthien/123456), 1 sensor, 1 device.')
  await pool.end()
}

main().catch((err) => {
  console.error('Seed thất bại:', err)
  process.exit(1)
})
