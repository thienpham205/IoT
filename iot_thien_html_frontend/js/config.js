// Cấu hình chung cho mọi trang (tương ứng constants.js + .env của bản React)

// Địa chỉ backend
const API_URL = 'http://localhost:3000/api'

// Mã cảm biến của node ESP8266
const SENSOR_CODE = 'SENSOR_01'

// Tài khoản demo: điền sẵn ở trang Đăng nhập và dùng khi chạy chế độ mock
const DEMO_ACCOUNT = { username: 'phamminhthien', password: '123456' }

// Trang chủ tải lại số liệu mỗi 2 giây; biểu đồ lấy 20 lần đo gần nhất
const REFRESH_MS = 2000
const CHART_POINTS = 20

// Các lựa chọn số dòng mỗi trang của bảng
const PAGE_SIZES = [5, 10, 20]
