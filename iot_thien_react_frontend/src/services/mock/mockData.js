// Dữ liệu mẫu tĩnh cố định (Static Mode) phục vụ báo cáo Frontend
// Hỗ trợ tìm kiếm theo ngày, giờ, phút linh hoạt (VD: 5:30, 17:30, 07/10/2026)

const mockUser = {
  id: 1,
  username: 'phamminhthien',
  fullName: 'Phạm Minh Thiện',
  studentId: 'B23DCAT285',
  email: 'phamminhthien@ptit.edu.vn',
  role: 'USER',
  githubLink: 'https://github.com/thienpham205/IoT',
  figmaLink: 'https://www.figma.com/design/FUkx7yZ5Nas3ofLx7wTZ9p/IOT_THIEN?node-id=2606-318&t=zmqpSwi2fBIHgSik-1',
  postmanLink: '/files/IOT_Thien_API.postman_collection.json',
  pdfLink: '/files/Pham_Minh_Thien_B23DCAT285_IOT_Report.pdf'
}

let mockDeviceList = [
  {
    deviceId: 1,
    deviceCode: 'LIGHT_01',
    deviceName: 'Đèn',
    deviceType: 'LIGHT',
    location: 'Phòng khách',
    status: 'OFF',
    mode: 'MANUAL',
    lastSeen: '2026-10-07T17:30:00+07:00'
  }
]

export function getMockUser() {
  return mockUser
}

export function getMockDevices() {
  return JSON.parse(JSON.stringify(mockDeviceList))
}

export function controlMockDevice(deviceId, payload) {
  const dev = mockDeviceList.find((d) => d.deviceId === Number(deviceId))
  if (dev) {
    dev.status = payload.action || 'OFF'
    dev.mode = payload.mode || 'MANUAL'
    dev.lastSeen = '2026-10-07T17:30:00+07:00'
  }

  const newHistory = {
    historyId: mockActions.length + 1,
    actionCode: `ACT_STATIC_${mockActions.length + 1}`,
    deviceId: Number(deviceId),
    deviceName: dev?.deviceName || 'Đèn',
    action: payload.action || 'OFF',
    actionTime: '2026-10-07T17:30:00+07:00',
    confirmedAt: '2026-10-07T17:30:01+07:00',
    result: 'SUCCESS',
    userName: mockUser.fullName,
    area: 'Phòng khách'
  }
  mockActions.unshift(newHistory)

  return {
    result: 'SUCCESS',
    status: payload.action,
    mode: payload.mode || 'MANUAL',
    confirmedAt: '2026-10-07T17:30:01+07:00'
  }
}

// Giá trị cảm biến cố định 100%
const STATIC_LATEST_SENSOR = {
  sensorCode: 'SENSOR_01',
  sensorName: 'Cảm biến phòng khách',
  temperature: 28.5,
  humidity: 65,
  light: 350,
  status: 'ACTIVE',
  recordedAt: '2026-10-07T17:30:00+07:00',
  stale: false,
  dataAgeSeconds: 0
}

export function getMockLatestSensor() {
  return STATIC_LATEST_SENSOR
}

// Biểu đồ thời gian thực tĩnh (cùng dạng response GET /sensor-data/chart?points=...)
const STATIC_CHART = {
  labels: [
    '16:20:00',
    '16:25:00',
    '16:30:00',
    '16:35:00',
    '16:40:00',
    '16:45:00',
    '16:50:00',
    '16:55:00',
    '17:00:00',
    '17:05:00',
    '17:10:00',
    '17:15:00',
    '17:20:00',
    '17:25:00',
    '17:30:00'
  ],
  series: {
    temperature: [28.4, 28.4, 28.5, 28.5, 28.5, 28.6, 28.6, 28.5, 28.5, 28.5, 28.4, 28.4, 28.5, 28.5, 28.5],
    humidity: [64.8, 65.0, 65.0, 65.2, 65.0, 65.3, 65.2, 65.0, 65.0, 64.9, 64.8, 65.0, 65.0, 65.1, 65.0],
    light: [348, 349, 350, 350, 352, 353, 352, 350, 350, 349, 348, 350, 350, 351, 350]
  },
  interval: 'raw',
  timezone: 'Asia/Ho_Chi_Minh'
}

export function getMockChart() {
  return STATIC_CHART
}

// Hàm so khớp thời gian theo giờ 24h: "5:30" chỉ khớp 05:30 (không khớp 17:30 hay 15:30),
// "17h" khớp mọi bản ghi trong giờ 17; các chuỗi khác (ngày, dd/MM/yyyy HH:mm...) so khớp chuỗi con
// So khớp CHÍNH XÁC thời gian (giờ 24h). Chỉ nhận các dạng:
//   "17:30" / "17:30:15"            -> đúng giờ:phút[:giây]
//   "17h"                            -> cả khung giờ 17
//   "07/10/2026"                     -> cả ngày đó
//   "07/10/2026 17:30[:15]"          -> đúng ngày + giờ
// Gõ dạng khác (VD "1", "10", "abc") -> không khớp.
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

// Dữ liệu đo cảm biến cố định
const mockSensorRecords = [
  {
    dataId: 24,
    sensorName: 'Nhiệt độ',
    sensorType: 'temperature',
    value: 28.5,
    unit: '°C',
    recordedAt: '2026-10-07T17:30:15+07:00'
  },
  {
    dataId: 23,
    sensorName: 'Độ ẩm',
    sensorType: 'humidity',
    value: 65,
    unit: '%',
    recordedAt: '2026-10-07T17:30:15+07:00'
  },
  {
    dataId: 22,
    sensorName: 'Ánh sáng',
    sensorType: 'light',
    value: 350,
    unit: 'lux',
    recordedAt: '2026-10-07T17:30:15+07:00'
  },

  {
    dataId: 21,
    sensorName: 'Nhiệt độ',
    sensorType: 'temperature',
    value: 28.4,
    unit: '°C',
    recordedAt: '2026-10-07T17:25:00+07:00'
  },
  {
    dataId: 20,
    sensorName: 'Độ ẩm',
    sensorType: 'humidity',
    value: 64,
    unit: '%',
    recordedAt: '2026-10-07T17:25:00+07:00'
  },
  {
    dataId: 19,
    sensorName: 'Ánh sáng',
    sensorType: 'light',
    value: 345,
    unit: 'lux',
    recordedAt: '2026-10-07T17:25:00+07:00'
  },

  {
    dataId: 18,
    sensorName: 'Nhiệt độ',
    sensorType: 'temperature',
    value: 28.6,
    unit: '°C',
    recordedAt: '2026-10-07T17:20:00+07:00'
  },
  {
    dataId: 17,
    sensorName: 'Độ ẩm',
    sensorType: 'humidity',
    value: 66,
    unit: '%',
    recordedAt: '2026-10-07T17:20:00+07:00'
  },
  {
    dataId: 16,
    sensorName: 'Ánh sáng',
    sensorType: 'light',
    value: 360,
    unit: 'lux',
    recordedAt: '2026-10-07T17:20:00+07:00'
  },

  {
    dataId: 15,
    sensorName: 'Nhiệt độ',
    sensorType: 'temperature',
    value: 28.3,
    unit: '°C',
    recordedAt: '2026-10-07T17:15:00+07:00'
  },
  {
    dataId: 14,
    sensorName: 'Độ ẩm',
    sensorType: 'humidity',
    value: 65,
    unit: '%',
    recordedAt: '2026-10-07T17:15:00+07:00'
  },
  {
    dataId: 13,
    sensorName: 'Ánh sáng',
    sensorType: 'light',
    value: 340,
    unit: 'lux',
    recordedAt: '2026-10-07T17:15:00+07:00'
  },

  {
    dataId: 12,
    sensorName: 'Nhiệt độ',
    sensorType: 'temperature',
    value: 28.2,
    unit: '°C',
    recordedAt: '2026-10-07T17:10:00+07:00'
  },
  {
    dataId: 11,
    sensorName: 'Độ ẩm',
    sensorType: 'humidity',
    value: 64,
    unit: '%',
    recordedAt: '2026-10-07T17:10:00+07:00'
  },
  {
    dataId: 10,
    sensorName: 'Ánh sáng',
    sensorType: 'light',
    value: 335,
    unit: 'lux',
    recordedAt: '2026-10-07T17:10:00+07:00'
  },

  {
    dataId: 9,
    sensorName: 'Nhiệt độ',
    sensorType: 'temperature',
    value: 28.0,
    unit: '°C',
    recordedAt: '2026-10-07T14:30:00+07:00'
  },
  {
    dataId: 8,
    sensorName: 'Độ ẩm',
    sensorType: 'humidity',
    value: 63,
    unit: '%',
    recordedAt: '2026-10-07T14:30:00+07:00'
  },
  {
    dataId: 7,
    sensorName: 'Ánh sáng',
    sensorType: 'light',
    value: 320,
    unit: 'lux',
    recordedAt: '2026-10-07T14:30:00+07:00'
  },

  {
    dataId: 6,
    sensorName: 'Nhiệt độ',
    sensorType: 'temperature',
    value: 27.9,
    unit: '°C',
    recordedAt: '2026-10-07T10:30:00+07:00'
  },
  {
    dataId: 5,
    sensorName: 'Độ ẩm',
    sensorType: 'humidity',
    value: 62,
    unit: '%',
    recordedAt: '2026-10-07T10:30:00+07:00'
  },
  {
    dataId: 4,
    sensorName: 'Ánh sáng',
    sensorType: 'light',
    value: 310,
    unit: 'lux',
    recordedAt: '2026-10-07T10:30:00+07:00'
  },

  {
    dataId: 3,
    sensorName: 'Nhiệt độ',
    sensorType: 'temperature',
    value: 27.8,
    unit: '°C',
    recordedAt: '2026-10-07T05:30:00+07:00'
  },
  {
    dataId: 2,
    sensorName: 'Độ ẩm',
    sensorType: 'humidity',
    value: 61,
    unit: '%',
    recordedAt: '2026-10-07T05:30:00+07:00'
  },
  {
    dataId: 1,
    sensorName: 'Ánh sáng',
    sensorType: 'light',
    value: 300,
    unit: 'lux',
    recordedAt: '2026-10-07T05:30:00+07:00'
  }
]

// Lọc giống backend /sensor-data: searchField quyết định tìm ở cột nào
//   id    -> đúng ID (chỉ khi nhập số)
//   value -> giá trị đo BẰNG ĐÚNG số đã nhập (VD "350" khớp 350; "35" không khớp; "28.50" khớp 28.5)
//   time  -> thời gian (xem matchTimeQuery)
//   all   -> một trong ba cột trên
function matchSensorSearch(record, search, searchField) {
  const any = searchField === 'all'
  const byId = (any || searchField === 'id') && /^\d+$/.test(search) && record.dataId === Number(search)
  const byValue = (any || searchField === 'value') && search !== '' && Number(search) === record.value
  const byTime = (any || searchField === 'time') && matchTimeQuery(record.recordedAt, search)
  return byId || byValue || byTime
}

export function getMockSensorHistory(params = {}) {
  const page = Number(params.page) || 0
  const size = Number(params.size) || 10
  const typeFilter = params.type || ''
  const searchField = params.searchField || 'all'
  const search = String(params.search || '').trim()

  const filtered = mockSensorRecords.filter((r) => {
    if (typeFilter && r.sensorType !== typeFilter) return false
    return !search || matchSensorSearch(r, search, searchField)
  })

  return paginate(filtered, page, size)
}

// Cắt một trang từ danh sách đã lọc, trả về cùng dạng response phân trang của backend
function paginate(list, page, size) {
  const start = page * size
  return {
    content: list.slice(start, start + size),
    page,
    size,
    totalElements: list.length,
    totalPages: Math.max(1, Math.ceil(list.length / size))
  }
}

// Dữ liệu lịch sử thao tác cố định với nhiều khung giờ thực tế
const mockActions = [
  {
    historyId: 10,
    actionCode: 'ACT_10',
    deviceId: 1,
    deviceName: 'Đèn',
    action: 'OFF',
    actionTime: '2026-10-07T17:30:15+07:00',
    confirmedAt: null,
    result: 'PENDING',
    userName: 'Phạm Minh Thiện',
    area: 'Phòng khách'
  },
  {
    historyId: 9,
    actionCode: 'ACT_09',
    deviceId: 1,
    deviceName: 'Đèn',
    action: 'ON',
    actionTime: '2026-10-07T17:30:00+07:00',
    confirmedAt: '2026-10-07T17:30:01+07:00',
    result: 'SUCCESS',
    userName: 'Phạm Minh Thiện',
    area: 'Phòng khách'
  },
  {
    historyId: 8,
    actionCode: 'ACT_08',
    deviceId: 1,
    deviceName: 'Đèn',
    action: 'OFF',
    actionTime: '2026-10-07T17:28:15+07:00',
    confirmedAt: null,
    result: 'FAILED',
    userName: 'Phạm Minh Thiện',
    area: 'Phòng khách'
  },
  {
    historyId: 7,
    actionCode: 'ACT_07',
    deviceId: 1,
    deviceName: 'Đèn',
    action: 'ON',
    actionTime: '2026-10-07T17:21:40+07:00',
    confirmedAt: '2026-10-07T17:21:41+07:00',
    result: 'SUCCESS',
    userName: 'Phạm Minh Thiện',
    area: 'Phòng khách'
  },
  {
    historyId: 6,
    actionCode: 'ACT_06',
    deviceId: 1,
    deviceName: 'Đèn',
    action: 'OFF',
    actionTime: '2026-10-07T17:14:02+07:00',
    confirmedAt: '2026-10-07T17:14:03+07:00',
    result: 'SUCCESS',
    userName: 'Phạm Minh Thiện',
    area: 'Phòng khách'
  },
  {
    historyId: 5,
    actionCode: 'ACT_05',
    deviceId: 1,
    deviceName: 'Đèn',
    action: 'ON',
    actionTime: '2026-10-07T17:08:22+07:00',
    confirmedAt: null,
    result: 'FAILED',
    userName: 'Phạm Minh Thiện',
    area: 'Phòng khách'
  },
  {
    historyId: 4,
    actionCode: 'ACT_04',
    deviceId: 1,
    deviceName: 'Đèn',
    action: 'OFF',
    actionTime: '2026-10-07T14:30:00+07:00',
    confirmedAt: '2026-10-07T14:30:01+07:00',
    result: 'SUCCESS',
    userName: 'Phạm Minh Thiện',
    area: 'Phòng khách'
  },
  {
    historyId: 3,
    actionCode: 'ACT_03',
    deviceId: 1,
    deviceName: 'Đèn',
    action: 'ON',
    actionTime: '2026-10-07T10:30:00+07:00',
    confirmedAt: '2026-10-07T10:30:01+07:00',
    result: 'SUCCESS',
    userName: 'Phạm Minh Thiện',
    area: 'Phòng khách'
  },
  {
    historyId: 2,
    actionCode: 'ACT_02',
    deviceId: 1,
    deviceName: 'Đèn',
    action: 'OFF',
    actionTime: '2026-10-07T09:55:10+07:00',
    confirmedAt: '2026-10-07T09:55:11+07:00',
    result: 'SUCCESS',
    userName: 'Phạm Minh Thiện',
    area: 'Phòng khách'
  },
  {
    historyId: 1,
    actionCode: 'ACT_01',
    deviceId: 1,
    deviceName: 'Đèn',
    action: 'ON',
    actionTime: '2026-10-07T05:30:00+07:00',
    confirmedAt: '2026-10-07T05:30:01+07:00',
    result: 'SUCCESS',
    userName: 'Phạm Minh Thiện',
    area: 'Phòng khách'
  }
]

export function getMockActionHistory(params = {}) {
  const page = Number(params.page) || 0
  const size = Number(params.size) || 10
  const deviceFilter = params.deviceId ? Number(params.deviceId) : null
  const actionFilter = params.action || ''
  const resultFilter = params.result || ''
  const search = String(params.search || '').trim()

  // Trang Lịch sử hoạt động luôn gửi searchField = 'time': ô tìm kiếm chỉ tìm theo thời gian
  const filtered = mockActions.filter((r) => {
    if (deviceFilter && r.deviceId !== deviceFilter) return false
    if (actionFilter && r.action !== actionFilter) return false
    if (resultFilter && r.result !== resultFilter) return false
    return !search || matchTimeQuery(r.actionTime, search)
  })

  return paginate(filtered, page, size)
}
