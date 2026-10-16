// Dịch vụ gọi API dữ liệu động từ Backend (Node.js/Express + MySQL)
// Toàn bộ dữ liệu tĩnh đã được loại bỏ, hệ thống truy vấn trực tiếp từ cơ sở dữ liệu.

// Lấy thông tin giá trị cảm biến mới nhất (Trang chủ)
async function getLatestSensor() {
  return await apiFetch('/sensor-data/latest')
}

// Lấy dữ liệu biểu đồ thời gian thực (Trang chủ - mặc định 20 mốc gần nhất)
async function getChartData(points = CHART_POINTS) {
  return await apiFetch(`/sensor-data/chart?points=${points}`)
}

// Lấy danh sách thiết bị (Trang chủ & Lọc lịch sử - hiện tại có 1 đèn LIGHT_01)
async function getDevices() {
  const res = await apiFetch('/devices')
  return res.devices || []
}

// Điều khiển bật / tắt thiết bị (Trang chủ)
async function setDeviceStatus(deviceId, action) {
  return await apiFetch(`/devices/${deviceId}/control`, {
    method: 'POST',
    body: JSON.stringify({ action, mode: 'MANUAL' })
  })
}

// Lấy danh sách dữ liệu cảm biến phân trang, tìm kiếm & lọc (Trang Cảm biến)
async function getSensorPage(params = {}) {
  const page = params.page ?? 0
  const size = params.size ?? 10
  const qs = new URLSearchParams()
  qs.set('page', page)
  qs.set('size', size)

  if (params.type === 'time') {
    if (params.search) {
      qs.set('search', params.search)
      qs.set('searchField', 'time')
    }
  } else {
    if (params.type) {
      qs.set('type', params.type)
    }
    if (params.search) {
      qs.set('search', params.search)
      qs.set('searchField', 'value')
    }
  }

  return await apiFetch(`/sensor-data?${qs.toString()}`)
}

// Lấy danh sách lịch sử điều khiển phân trang & lọc (Trang Lịch sử hoạt động)
async function getActionPage(params = {}) {
  const page = params.page ?? 0
  const size = params.size ?? 10
  const qs = new URLSearchParams()
  qs.set('page', page)
  qs.set('size', size)

  if (params.deviceId) qs.set('deviceId', params.deviceId)
  if (params.action) qs.set('action', params.action)
  if (params.result) qs.set('result', params.result)
  if (params.search) {
    qs.set('search', params.search)
    qs.set('searchField', 'time')
  }

  return await apiFetch(`/action-history?${qs.toString()}`)
}

// Lấy thông tin tài khoản người dùng (Trang Hồ sơ)
async function getProfile() {
  const res = await apiFetch('/auth/me')
  return res.user
}
