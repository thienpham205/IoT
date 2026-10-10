# IoT_ThienPM

Hệ thống giám sát môi trường (nhiệt độ, độ ẩm, ánh sáng) và điều khiển đèn qua web,
dùng ESP8266 + MQTT + Node.js + React.

```text
ESP8266 (DHT11, quang trở, LED D0)
   ⇅ MQTT (Mosquitto)
Node.js / Express backend ── MySQL
   ⇅ REST/JSON + JWT
React frontend
```

Frontend không kết nối trực tiếp MQTT hay MySQL; mọi thao tác đi qua REST API của backend.

## Cấu trúc

| Thư mục | Nội dung |
|---|---|
| `iot_thien_backend/` | API Express, kết nối MySQL và MQTT broker |
| `iot_thien_react_frontend/` | Giao diện React (Vite) |
| `iot_thien_firmware/sketch_aug29a/` | Firmware ESP8266 (Arduino) |

## Giao diện

1. **Đăng nhập** – tài khoản demo `phamminhthien` / `123456`
2. **Trang chủ** – giá trị đo mới nhất, biểu đồ (thời gian thực / 1 giờ / 24 giờ), bật/tắt đèn
3. **Cảm biến** – lọc theo loại cảm biến, tìm theo giá trị hoặc thời gian, phân trang 5 / 10 / 20 dòng
4. **Lịch sử hoạt động** – lọc theo thiết bị, hành động, trạng thái, thời gian; phân trang
5. **Hồ sơ** – thông tin tài khoản, liên kết GitHub / Figma / Postman / báo cáo PDF

Khi không kết nối được backend, frontend tự chuyển sang dữ liệu mẫu (`src/services/mock/mockData.js`).

## Chạy local

Yêu cầu: Node.js 18+, Docker, Mosquitto (MQTT broker).

```bash
# 1. MySQL
cd iot_thien_backend
docker compose up -d
docker exec -i iot_thien_mysql mysql -uiot_thien -piot_thien_password iot_thien < sql/schema.sql

# 2. Backend (cổng 3000)
cp .env.example .env      # điền JWT_SECRET, tài khoản MQTT
npm install
npm run seed              # tạo tài khoản demo, cảm biến SENSOR_01, đèn LIGHT_01
npm run dev

# 3. Frontend (cổng 5173)
cd ../iot_thien_react_frontend
cp .env.example .env
npm install
npm run dev
```

Firmware: chép `secrets.example.h` thành `secrets.h` (cùng thư mục sketch), điền WiFi và MQTT,
rồi nạp bằng Arduino IDE với board **NodeMCU 1.0 (ESP-12E Module)**.

## REST API

| Method | Đường dẫn | Mô tả |
|---|---|---|
| POST | `/api/auth/login` | Đăng nhập, trả JWT |
| GET | `/api/auth/me` | Thông tin người dùng |
| GET | `/api/sensors` | Danh sách cảm biến |
| GET | `/api/sensor-data/latest?sensorCode` | Lần đo mới nhất |
| GET | `/api/sensor-data/chart?points` hoặc `?interval&from&to&sensorCode` | Dữ liệu biểu đồ |
| GET | `/api/sensor-data?type&search&searchField&from&to&sort&page&size` | Lịch sử giá trị đo (mỗi dòng 1 loại cảm biến) |
| GET | `/api/sensor-data/{dataId}` | Chi tiết một lần đo |
| GET | `/api/devices` | Danh sách thiết bị |
| POST | `/api/devices/{deviceId}/control` | Bật/tắt thiết bị (`{ action: "ON" \| "OFF" }`) |
| GET | `/api/action-history?deviceId&action&result&search&searchField&from&to&page&size` | Lịch sử điều khiển |
| GET | `/api/action-history/{historyId}` | Chi tiết một lần điều khiển |

## MQTT topic

| Topic | Chiều |
|---|---|
| `iot/sensors/{sensorCode}/data` | ESP8266 → Backend |
| `iot/devices/{deviceCode}/command` | Backend → ESP8266 |
| `iot/devices/{deviceCode}/status` | ESP8266 → Backend (ACK) |
| `iot/nodes/{nodeId}/heartbeat` | ESP8266 → Backend |
