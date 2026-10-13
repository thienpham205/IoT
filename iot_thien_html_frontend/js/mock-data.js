// Dữ liệu mẫu tĩnh, dùng khi không kết nối được backend (tương ứng services/mock/mockData.js)

const mockUser = {
  id: 1,
  username: 'phamminhthien',
  fullName: 'Phạm Minh Thiện',
  studentId: 'B23DCAT285',
  email: 'phamminhthien@ptit.edu.vn',
  role: 'USER',
  githubLink: 'https://github.com/thienpham205/IoT',
  figmaLink: 'https://www.figma.com/design/FUkx7yZ5Nas3ofLx7wTZ9p/IOT_THIEN?node-id=2606-318&t=zmqpSwi2fBIHgSik-1',
  postmanLink: 'files/IOT_Thien_API.postman_collection.json',
  pdfLink: 'files/Pham_Minh_Thien_B23DCAT285_IOT_Report.pdf'
}

const mockDeviceList = [
  { deviceId: 1, deviceCode: 'LIGHT_01', deviceName: 'Đèn', deviceType: 'LIGHT', location: 'Phòng khách', status: 'OFF', mode: 'MANUAL' },
  { deviceId: 2, deviceCode: 'LIGHT_02', deviceName: 'Đèn 2', deviceType: 'LIGHT', location: 'Phòng ngủ', status: 'OFF', mode: 'MANUAL' }
]

function getMockUser() {
  return mockUser
}

function getMockDevices() {
  return JSON.parse(JSON.stringify(mockDeviceList))
}

// Bật/tắt đèn ở chế độ tĩnh: đổi status trong danh sách + ghi thêm 1 dòng lịch sử
function controlMockDevice(deviceId, payload) {
  const dev = mockDeviceList.find((d) => d.deviceId === Number(deviceId))
  if (dev) dev.status = payload.action || 'OFF'

  mockActions.unshift({
    historyId: mockActions.length + 1,
    actionCode: `ACT_STATIC_${mockActions.length + 1}`,
    deviceId: Number(deviceId),
    deviceName: dev ? dev.deviceName : 'Đèn',
    action: payload.action || 'OFF',
    actionTime: '2026-10-07T17:30:00+07:00',
    confirmedAt: '2026-10-07T17:30:01+07:00',
    result: 'SUCCESS',
    userName: mockUser.fullName,
    area: dev ? dev.location : 'Phòng khách'
  })

  return { result: 'SUCCESS', status: payload.action, mode: payload.mode || 'MANUAL', confirmedAt: '2026-10-07T17:30:01+07:00' }
}

function getMockLatestSensor() {
  return {
    sensorCode: 'SENSOR_01',
    sensorName: 'Cảm biến phòng khách',
    temperature: 28.5,
    humidity: 65,
    light: 350,
    status: 'ACTIVE',
    recordedAt: '2026-10-07T17:30:00+07:00'
  }
}

// Biểu đồ thời gian thực tĩnh (cùng dạng response GET /sensor-data/chart?points=...)
function getMockChart() {
  return {
    labels: ['16:20:00', '16:25:00', '16:30:00', '16:35:00', '16:40:00', '16:45:00', '16:50:00', '16:55:00',
      '17:00:00', '17:05:00', '17:10:00', '17:15:00', '17:20:00', '17:25:00', '17:30:00'],
    series: {
      temperature: [28.4, 28.4, 28.5, 28.5, 28.5, 28.6, 28.6, 28.5, 28.5, 28.5, 28.4, 28.4, 28.5, 28.5, 28.5],
      humidity: [64.8, 65.0, 65.0, 65.2, 65.0, 65.3, 65.2, 65.0, 65.0, 64.9, 64.8, 65.0, 65.0, 65.1, 65.0],
      light: [348, 349, 350, 350, 352, 353, 352, 350, 350, 349, 348, 350, 350, 351, 350]
    }
  }
}

// So khớp CHÍNH XÁC thời gian (giờ 24h). Chỉ nhận các dạng:
//   "17:30" / "17:30:15"     -> đúng giờ:phút[:giây]
//   "17h"                     -> cả khung giờ 17
//   "07/10/2026"              -> cả ngày đó
//   "07/10/2026 17:30[:15]"   -> đúng ngày + giờ
// Gõ dạng khác (VD "1", "abc") -> không khớp.
function matchTimeQuery(dateValue, search) {
  const s = String(search || '').trim()
  if (!s) return true
  const d = new Date(dateValue)
  if (!dateValue || isNaN(d.getTime())) return false

  const sameClock = (h, m, sec) =>
    d.getHours() === +h && d.getMinutes() === +m && (sec === undefined || d.getSeconds() === +sec)

  const date = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/)
  if (date) {
    const [, day, month, year, h, m, sec] = date
    const sameDay = d.getDate() === +day && d.getMonth() + 1 === +month && d.getFullYear() === +year
    return sameDay && (h === undefined || sameClock(h, m, sec))
  }
  const clock = s.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/)
  if (clock) return sameClock(clock[1], clock[2], clock[3])
  const hourOnly = s.match(/^(\d{1,2})h$/i)
  if (hourOnly) return d.getHours() === +hourOnly[1]
  return false
}

// Mỗi lần đo: [ID, nhiệt độ, độ ẩm, ánh sáng, thời gian] -> tách thành 3 dòng như bảng Cảm biến
const SENSOR_UNITS = { temperature: '°C', humidity: '%', light: 'lux' }
const mockSensorRecords = [
  [8, 28.5, 65, 350, '2026-10-07T17:30:15+07:00'],
  [7, 28.4, 64, 345, '2026-10-07T17:25:00+07:00'],
  [6, 28.6, 66, 360, '2026-10-07T17:20:00+07:00'],
  [5, 28.3, 65, 340, '2026-10-07T17:15:00+07:00'],
  [4, 28.2, 64, 335, '2026-10-07T17:10:00+07:00'],
  [3, 28.0, 63, 320, '2026-10-07T14:30:00+07:00'],
  [2, 27.9, 62, 310, '2026-10-07T10:30:00+07:00'],
  [1, 27.8, 61, 300, '2026-10-07T05:30:00+07:00']
].flatMap(([n, temperature, humidity, light, recordedAt]) =>
  Object.entries({ temperature, humidity, light }).map(([sensorType, value], i) => ({
    dataId: n * 3 - i,
    sensorType,
    value,
    unit: SENSOR_UNITS[sensorType],
    recordedAt
  }))
)

// Lọc giống backend /sensor-data: searchField quyết định tìm ở cột nào
//   id -> đúng ID; value -> giá trị BẰNG ĐÚNG số đã nhập; time -> xem matchTimeQuery; all -> một trong ba
function matchSensorSearch(record, search, searchField) {
  const any = searchField === 'all'
  const byId = (any || searchField === 'id') && /^\d+$/.test(search) && record.dataId === Number(search)
  const byValue = (any || searchField === 'value') && search !== '' && Number(search) === record.value
  const byTime = (any || searchField === 'time') && matchTimeQuery(record.recordedAt, search)
  return byId || byValue || byTime
}

// Cắt một trang từ danh sách đã lọc, trả về cùng dạng response phân trang của backend
function paginate(list, page, size) {
  const start = page * size
  return { content: list.slice(start, start + size), page, size, totalElements: list.length, totalPages: Math.max(1, Math.ceil(list.length / size)) }
}

function getMockSensorHistory(params = {}) {
  const search = String(params.search || '').trim()
  const filtered = mockSensorRecords.filter((r) => {
    if (params.type && r.sensorType !== params.type) return false
    return !search || matchSensorSearch(r, search, params.searchField || 'all')
  })
  return paginate(filtered, Number(params.page) || 0, Number(params.size) || 10)
}

// Lịch sử bật/tắt: [ID, hành động, thời gian, kết quả]
const mockActions = [
  [10, 'OFF', '2026-10-07T17:30:15+07:00', 'PENDING'],
  [9, 'ON', '2026-10-07T17:30:00+07:00', 'SUCCESS'],
  [8, 'OFF', '2026-10-07T17:28:15+07:00', 'FAILED'],
  [7, 'ON', '2026-10-07T17:21:40+07:00', 'SUCCESS'],
  [6, 'OFF', '2026-10-07T17:14:02+07:00', 'SUCCESS'],
  [5, 'ON', '2026-10-07T17:08:22+07:00', 'FAILED'],
  [4, 'OFF', '2026-10-07T14:30:00+07:00', 'SUCCESS'],
  [3, 'ON', '2026-10-07T10:30:00+07:00', 'SUCCESS'],
  [2, 'OFF', '2026-10-07T09:55:10+07:00', 'SUCCESS'],
  [1, 'ON', '2026-10-07T05:30:00+07:00', 'SUCCESS']
].map(([historyId, action, actionTime, result]) => ({
  historyId,
  actionCode: `ACT_${String(historyId).padStart(2, '0')}`,
  deviceId: 1,
  deviceName: 'Đèn',
  action,
  actionTime,
  confirmedAt: result === 'SUCCESS' ? actionTime : null,
  result,
  userName: 'Phạm Minh Thiện',
  area: 'Phòng khách'
}))

function getMockActionHistory(params = {}) {
  const search = String(params.search || '').trim()
  const filtered = mockActions.filter((r) => {
    if (params.deviceId && r.deviceId !== Number(params.deviceId)) return false
    if (params.action && r.action !== params.action) return false
    if (params.result && r.result !== params.result) return false
    return !search || matchTimeQuery(r.actionTime, search)
  })
  return paginate(filtered, Number(params.page) || 0, Number(params.size) || 10)
}
