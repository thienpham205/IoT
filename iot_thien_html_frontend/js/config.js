// Cấu hình chung cho mọi trang

// Địa chỉ Backend REST API
const API_BASE_URL = 'http://localhost:3000/api'

// Tài khoản đăng nhập demo (điền sẵn ở trang Đăng nhập)
const DEMO_ACCOUNT = { username: 'phamminhthien', password: '123456' }

// Biểu đồ Trang chủ hiển thị 20 mốc gần nhất
const CHART_POINTS = 20

// Các lựa chọn số dòng mỗi trang của bảng
const PAGE_SIZES = [5, 10, 20]

// Hàm gọi API dùng chung kết nối với Backend
async function apiFetch(endpoint, options = {}) {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`
  const token = localStorage.getItem('iot_thien_token')

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let response
  try {
    response = await fetch(url, {
      ...options,
      headers
    })
  } catch {
    // Backend chưa chạy / mất mạng: fetch báo "Failed to fetch", đổi sang thông báo tiếng Việt
    throw new Error('Không kết nối được máy chủ')
  }

  const data = await response.json().catch(() => ({}))

  // 401 khi đã có token: token hết hạn/không hợp lệ -> xoá phiên và về trang Đăng nhập.
  // 401 khi chưa có token (đang đăng nhập sai) thì giữ nguyên trang, hiện thông báo của Backend.
  if (response.status === 401 && token) {
    localStorage.removeItem('iot_thien_token')
    localStorage.removeItem('iot_thien_user')
    location.replace('login.html')
    throw new Error('Hết phiên đăng nhập, vui lòng đăng nhập lại')
  }

  if (!response.ok) {
    const errorMsg = data?.message || `Lỗi yêu cầu máy chủ (${response.status})`
    throw new Error(errorMsg)
  }

  return data
}
