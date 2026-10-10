# IOT_Thien – React Frontend

Frontend được dựng theo giao diện Figma của bài IOT_THIEN và nội dung báo cáo:
- ReactJS theo component
- Axios gọi REST API
- Chart.js hiển thị biểu đồ
- JWT ở tầng Frontend/Backend
- Frontend không kết nối trực tiếp MQTT hoặc MySQL

## Màn hình
1. Đăng nhập
2. Dashboard
   - Dữ liệu nhiệt độ / độ ẩm / ánh sáng mới nhất
   - Biểu đồ 24 giờ
   - Điều khiển Quạt / Đèn / Điều hòa
   - Chỉ xác nhận trạng thái sau ACK
3. Data Sensor
   - Search / status / sort / pagination / export CSV
   - Thứ tự cột: Tên cảm biến → Nhiệt độ → Độ ẩm → Ánh sáng → Thời gian → Trạng thái → ID
4. Action History
   - Lọc thiết bị / action / result / pagination / export
   - Thứ tự cột: Tên thiết bị → Hành động → Thời gian → Kết quả → Người thao tác → Khu vực → ID
5. Profile

## Chạy demo
```bash
npm install
cp .env.example .env
npm run dev
```

Mở:
http://localhost:5173

### Tài khoản mock
- Username: `phamminhthien`
- Password: `123456`

Mặc định `.env.example` dùng:
```env
VITE_USE_MOCK=true
VITE_API_URL=http://localhost:3000/api
```

Để nối Backend thật:
```env
VITE_USE_MOCK=false
VITE_API_URL=http://localhost:3000/api
```

## REST API đã map theo báo cáo
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/sensor-data/latest?sensorCode=...`
- `GET /api/sensors`
- `GET /api/sensor-data/chart?from&to&interval&sensorCode`
- `GET /api/sensor-data?page&size&search&sort&from&to&status`
- `GET /api/devices`
- `POST /api/devices/{deviceId}/control`
- `GET /api/action-history?page&size&deviceId&action&result&from&to`

## Kiến trúc
```text
User
  ↓
React Frontend
  ↓ REST/JSON + JWT
Node.js / Express Backend
  ├── MySQL
  └── MQTT.js → Mosquitto → ESP8266
```

Frontend không publish MQTT trực tiếp.
