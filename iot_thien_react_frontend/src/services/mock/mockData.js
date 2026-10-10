// Dữ liệu mẫu tĩnh cố định (Static Mode) phục vụ báo cáo Frontend
// Hỗ trợ tìm kiếm theo ngày, giờ, phút linh hoạt (VD: 5:30, 17:30, 07/10/2026)

export const mockUser = {
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

// Biểu đồ tĩnh cố định: đường ngang mềm mại, hơi lượn sóng nhẹ nhàng
const STATIC_CHART_LIVE = {
  labels: [
    '16:20:00', '16:25:00', '16:30:00', '16:35:00', '16:40:00',
    '16:45:00', '16:50:00', '16:55:00', '17:00:00', '17:05:00',
    '17:10:00', '17:15:00', '17:20:00', '17:25:00', '17:30:00'
  ],
  series: {
    temperature: [28.4, 28.4, 28.5, 28.5, 28.5, 28.6, 28.6, 28.5, 28.5, 28.5, 28.4, 28.4, 28.5, 28.5, 28.5],
    humidity: [64.8, 65.0, 65.0, 65.2, 65.0, 65.3, 65.2, 65.0, 65.0, 64.9, 64.8, 65.0, 65.0, 65.1, 65.0],
    light: [348, 349, 350, 350, 352, 353, 352, 350, 350, 349, 348, 350, 350, 351, 350]
  },
  interval: 'raw',
  timezone: 'Asia/Ho_Chi_Minh'
}

const STATIC_CHART_1H = {
  labels: [
    '16:30', '16:35', '16:40', '16:45', '16:50', '16:55',
    '17:00', '17:05', '17:10', '17:15', '17:20', '17:25', '17:30'
  ],
  series: {
    temperature: [28.3, 28.4, 28.4, 28.5, 28.5, 28.6, 28.5, 28.5, 28.5, 28.4, 28.5, 28.5, 28.5],
    humidity: [64.8, 65.0, 65.0, 65.2, 65.4, 65.2, 65.0, 65.0, 64.8, 65.0, 65.0, 65.2, 65.0],
    light: [347, 349, 350, 351, 353, 352, 350, 350, 349, 350, 350, 351, 350]
  },
  interval: '1m',
  timezone: 'Asia/Ho_Chi_Minh'
}

const STATIC_CHART_24H = {
  labels: [
    '18:00', '20:00', '22:00', '00:00', '02:00', '04:00',
    '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '17:30'
  ],
  series: {
    temperature: [28.2, 28.0, 27.8, 27.5, 27.4, 27.5, 27.8, 28.2, 28.5, 28.7, 28.6, 28.5, 28.5],
    humidity: [65.5, 66.0, 66.5, 67.0, 67.2, 67.0, 66.5, 65.5, 64.5, 64.0, 64.5, 64.8, 65.0],
    light: [250, 100, 20, 0, 0, 30, 180, 300, 360, 380, 370, 360, 350]
  },
  interval: '1h',
  timezone: 'Asia/Ho_Chi_Minh'
}

export function getMockChart(params = {}) {
  if (params.interval === '1h') return STATIC_CHART_24H
  if (params.interval === '1m') return STATIC_CHART_1H
  return STATIC_CHART_LIVE
}

// Hàm so khớp thời gian theo giờ 24h: "5:30" chỉ khớp 05:30 (không khớp 17:30 hay 15:30),
// "17h" khớp mọi bản ghi trong giờ 17; các chuỗi khác (ngày, dd/MM/yyyy HH:mm...) so khớp chuỗi con
export function matchTimeQuery(dateValue, search) {
  if (!search) return true
  if (!dateValue) return false
  const s = String(search).trim().toLowerCase()
  if (!s) return true

  const d = new Date(dateValue)
  if (isNaN(d.getTime())) return false

  const pad = (n) => String(n).padStart(2, '0')
  const day = d.getDate()
  const month = d.getMonth() + 1
  const year = d.getFullYear()
  const hour = d.getHours()
  const min = d.getMinutes()
  const sec = d.getSeconds()

  // Giờ:phút[:giây] (VD: "5:30", "05:30", "17:30:15") -> so khớp chính xác
  const m = s.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/)
  if (m) {
    return hour === +m[1] && min === +m[2] && (m[3] === undefined || sec === +m[3])
  }

  // Chỉ giờ (VD: "5h", "17h", "17:") -> mọi bản ghi trong giờ đó
  const hourMatch = s.match(/^(\d{1,2})(?:h|:)$/)
  if (hourMatch) return hour === +hourMatch[1]

  // Ngày / ngày giờ đầy đủ: so khớp chuỗi con trên định dạng hiển thị dd/MM/yyyy HH:mm:ss
  const formatted = `${pad(day)}/${pad(month)}/${year} ${pad(hour)}:${pad(min)}:${pad(sec)}`
  return formatted.includes(s) || `${day}/${month}/${year}`.includes(s)
}

// Dữ liệu đo cảm biến cố định
const mockSensorRecords = [
  { dataId: 24, sensorName: 'Nhiệt độ', sensorType: 'temperature', value: 28.5, unit: '°C', recordedAt: '2026-10-07T17:30:15+07:00' },
  { dataId: 23, sensorName: 'Độ ẩm', sensorType: 'humidity', value: 65, unit: '%', recordedAt: '2026-10-07T17:30:15+07:00' },
  { dataId: 22, sensorName: 'Ánh sáng', sensorType: 'light', value: 350, unit: 'lux', recordedAt: '2026-10-07T17:30:15+07:00' },

  { dataId: 21, sensorName: 'Nhiệt độ', sensorType: 'temperature', value: 28.4, unit: '°C', recordedAt: '2026-10-07T17:25:00+07:00' },
  { dataId: 20, sensorName: 'Độ ẩm', sensorType: 'humidity', value: 64, unit: '%', recordedAt: '2026-10-07T17:25:00+07:00' },
  { dataId: 19, sensorName: 'Ánh sáng', sensorType: 'light', value: 345, unit: 'lux', recordedAt: '2026-10-07T17:25:00+07:00' },

  { dataId: 18, sensorName: 'Nhiệt độ', sensorType: 'temperature', value: 28.6, unit: '°C', recordedAt: '2026-10-07T17:20:00+07:00' },
  { dataId: 17, sensorName: 'Độ ẩm', sensorType: 'humidity', value: 66, unit: '%', recordedAt: '2026-10-07T17:20:00+07:00' },
  { dataId: 16, sensorName: 'Ánh sáng', sensorType: 'light', value: 360, unit: 'lux', recordedAt: '2026-10-07T17:20:00+07:00' },

  { dataId: 15, sensorName: 'Nhiệt độ', sensorType: 'temperature', value: 28.3, unit: '°C', recordedAt: '2026-10-07T17:15:00+07:00' },
  { dataId: 14, sensorName: 'Độ ẩm', sensorType: 'humidity', value: 65, unit: '%', recordedAt: '2026-10-07T17:15:00+07:00' },
  { dataId: 13, sensorName: 'Ánh sáng', sensorType: 'light', value: 340, unit: 'lux', recordedAt: '2026-10-07T17:15:00+07:00' },

  { dataId: 12, sensorName: 'Nhiệt độ', sensorType: 'temperature', value: 28.2, unit: '°C', recordedAt: '2026-10-07T17:10:00+07:00' },
  { dataId: 11, sensorName: 'Độ ẩm', sensorType: 'humidity', value: 64, unit: '%', recordedAt: '2026-10-07T17:10:00+07:00' },
  { dataId: 10, sensorName: 'Ánh sáng', sensorType: 'light', value: 335, unit: 'lux', recordedAt: '2026-10-07T17:10:00+07:00' },

  { dataId: 9, sensorName: 'Nhiệt độ', sensorType: 'temperature', value: 28.0, unit: '°C', recordedAt: '2026-10-07T14:30:00+07:00' },
  { dataId: 8, sensorName: 'Độ ẩm', sensorType: 'humidity', value: 63, unit: '%', recordedAt: '2026-10-07T14:30:00+07:00' },
  { dataId: 7, sensorName: 'Ánh sáng', sensorType: 'light', value: 320, unit: 'lux', recordedAt: '2026-10-07T14:30:00+07:00' },

  { dataId: 6, sensorName: 'Nhiệt độ', sensorType: 'temperature', value: 27.9, unit: '°C', recordedAt: '2026-10-07T10:30:00+07:00' },
  { dataId: 5, sensorName: 'Độ ẩm', sensorType: 'humidity', value: 62, unit: '%', recordedAt: '2026-10-07T10:30:00+07:00' },
  { dataId: 4, sensorName: 'Ánh sáng', sensorType: 'light', value: 310, unit: 'lux', recordedAt: '2026-10-07T10:30:00+07:00' },

  { dataId: 3, sensorName: 'Nhiệt độ', sensorType: 'temperature', value: 27.8, unit: '°C', recordedAt: '2026-10-07T05:30:00+07:00' },
  { dataId: 2, sensorName: 'Độ ẩm', sensorType: 'humidity', value: 61, unit: '%', recordedAt: '2026-10-07T05:30:00+07:00' },
  { dataId: 1, sensorName: 'Ánh sáng', sensorType: 'light', value: 300, unit: 'lux', recordedAt: '2026-10-07T05:30:00+07:00' }
]

export function getMockSensorHistory(params = {}) {
  const page = Number(params.page) || 0
  const size = Number(params.size) || 10
  const typeFilter = params.type || ''
  const search = String(params.search || '').trim().toLowerCase()

  const filtered = mockSensorRecords.filter((r) => {
    if (typeFilter && typeFilter !== 'time' && r.sensorType !== typeFilter) return false
    if (search) {
      const matchVal = String(r.value).toLowerCase().includes(search)
      const matchName = r.sensorName.toLowerCase().includes(search)
      const matchId = String(r.dataId).includes(search)
      const matchTime = matchTimeQuery(r.recordedAt, search)

      if (typeFilter === 'time') {
        return matchTime
      }
      return matchVal || matchName || matchId || matchTime
    }
    return true
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
  { historyId: 10, actionCode: 'ACT_10', deviceId: 1, deviceName: 'Đèn', action: 'OFF', actionTime: '2026-10-07T17:30:15+07:00', confirmedAt: '2026-10-07T17:30:16+07:00', result: 'SUCCESS', userName: 'Phạm Minh Thiện', area: 'Phòng khách' },
  { historyId: 9,  actionCode: 'ACT_09', deviceId: 1, deviceName: 'Đèn', action: 'ON',  actionTime: '2026-10-07T17:30:00+07:00', confirmedAt: '2026-10-07T17:30:01+07:00', result: 'SUCCESS', userName: 'Phạm Minh Thiện', area: 'Phòng khách' },
  { historyId: 8,  actionCode: 'ACT_08', deviceId: 1, deviceName: 'Đèn', action: 'OFF', actionTime: '2026-10-07T17:28:15+07:00', confirmedAt: '2026-10-07T17:28:16+07:00', result: 'SUCCESS', userName: 'Phạm Minh Thiện', area: 'Phòng khách' },
  { historyId: 7,  actionCode: 'ACT_07', deviceId: 1, deviceName: 'Đèn', action: 'ON',  actionTime: '2026-10-07T17:21:40+07:00', confirmedAt: '2026-10-07T17:21:41+07:00', result: 'SUCCESS', userName: 'Phạm Minh Thiện', area: 'Phòng khách' },
  { historyId: 6,  actionCode: 'ACT_06', deviceId: 1, deviceName: 'Đèn', action: 'OFF', actionTime: '2026-10-07T17:14:02+07:00', confirmedAt: '2026-10-07T17:14:03+07:00', result: 'SUCCESS', userName: 'Phạm Minh Thiện', area: 'Phòng khách' },
  { historyId: 5,  actionCode: 'ACT_05', deviceId: 1, deviceName: 'Đèn', action: 'ON',  actionTime: '2026-10-07T17:08:22+07:00', confirmedAt: '2026-10-07T17:08:23+07:00', result: 'SUCCESS', userName: 'Phạm Minh Thiện', area: 'Phòng khách' },
  { historyId: 4,  actionCode: 'ACT_04', deviceId: 1, deviceName: 'Đèn', action: 'OFF', actionTime: '2026-10-07T14:30:00+07:00', confirmedAt: '2026-10-07T14:30:01+07:00', result: 'SUCCESS', userName: 'Phạm Minh Thiện', area: 'Phòng khách' },
  { historyId: 3,  actionCode: 'ACT_03', deviceId: 1, deviceName: 'Đèn', action: 'ON',  actionTime: '2026-10-07T10:30:00+07:00', confirmedAt: '2026-10-07T10:30:01+07:00', result: 'SUCCESS', userName: 'Phạm Minh Thiện', area: 'Phòng khách' },
  { historyId: 2,  actionCode: 'ACT_02', deviceId: 1, deviceName: 'Đèn', action: 'OFF', actionTime: '2026-10-07T09:55:10+07:00', confirmedAt: '2026-10-07T09:55:11+07:00', result: 'SUCCESS', userName: 'Phạm Minh Thiện', area: 'Phòng khách' },
  { historyId: 1,  actionCode: 'ACT_01', deviceId: 1, deviceName: 'Đèn', action: 'ON',  actionTime: '2026-10-07T05:30:00+07:00', confirmedAt: '2026-10-07T05:30:01+07:00', result: 'SUCCESS', userName: 'Phạm Minh Thiện', area: 'Phòng khách' }
]

export function getMockActionHistory(params = {}) {
  const page = Number(params.page) || 0
  const size = Number(params.size) || 10
  const actionFilter = params.action || ''
  const resultFilter = params.result || ''
  const search = String(params.search || '').trim().toLowerCase()

  const filtered = mockActions.filter((r) => {
    if (actionFilter && r.action !== actionFilter) return false
    if (resultFilter && r.result !== resultFilter) return false
    if (search) {
      const matchTime = matchTimeQuery(r.actionTime, search)
      const matchDevice = r.deviceName.toLowerCase().includes(search)
      const matchUser = r.userName.toLowerCase().includes(search)
      const matchId = String(r.historyId).includes(search)
      if (!matchTime && !matchDevice && !matchUser && !matchId) return false
    }
    return true
  })

  return paginate(filtered, page, size)
}
