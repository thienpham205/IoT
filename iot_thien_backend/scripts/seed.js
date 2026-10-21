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
      'https://github.com/thienpham205/IoT',
      'https://www.figma.com/design/FUkx7yZ5Nas3ofLx7wTZ9p/IOT_THIEN?node-id=2606-318&t=zmqpSwi2fBIHgSik-1',
      'https://www.postman.com/thienpham13112005aa-5408488/iot-thienpm/collection/tjp577w/iot-thien-api?action=share&creator=58995019',
      'files/Pham_Minh_Thien_B23DCAT285_IoT_Bai4.pdf'
    ]
  )

  await pool.query(
    `INSERT INTO sensors (sensor_code, sensor_name, sensor_type, unit, location, status)
     VALUES ('SENSOR_01', 'Cảm biến phòng khách', 'DHT11 + Quang trở', 'C/%/lux', 'Phòng khách', 'ACTIVE')
     ON DUPLICATE KEY UPDATE sensor_name = VALUES(sensor_name)`
  )

  // LIGHT_01 khớp đúng device_code mà firmware ESP8266 (esp8266-01) đang publish/subscribe
  // qua MQTT (LED thật trên chân D0). Mạch chỉ có 1 đèn nên chỉ tạo 1 thiết bị.
  const devices = [['LIGHT_01', 'Đèn', 'LIGHT', '']]
  for (const [code, name, type, location] of devices) {
    await pool.query(
      `INSERT INTO devices (device_code, device_name, device_type, location, status, mode)
       VALUES (?, ?, ?, ?, 'OFF', 'MANUAL')
       ON DUPLICATE KEY UPDATE device_name = VALUES(device_name)`,
      [code, name, type, location]
    )
  }

  console.log(`Seed hoàn tất: 1 user (phamminhthien/123456), 1 sensor, ${devices.length} device.`)
  await pool.end()
}

main().catch((err) => {
  console.error('Seed thất bại:', err)
  process.exit(1)
})
