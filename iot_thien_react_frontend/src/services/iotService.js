import { api } from './api'
import {
  controlMockDevice,
  getMockActionHistory,
  getMockChart,
  getMockDevices,
  getMockLatestSensor,
  getMockSensorHistory,
  getMockUser
} from './mock/mockData'

const DEMO_USERNAME = 'phamminhthien'
const DEMO_PASSWORD = '123456'

function isNetworkError(err) {
  return (
    !err?.response ||
    err?.code === 'ERR_NETWORK' ||
    err?.message === 'Network Error' ||
    String(err?.message || '').includes('Network Error')
  )
}

// Gọi API thật; nếu không kết nối được backend thì trả dữ liệu mock (chế độ tĩnh).
// Lỗi từ backend (401, 400, 500...) vẫn được ném ra như bình thường.
async function requestOrMock(request, mockFallback) {
  try {
    return await request()
  } catch (err) {
    if (isNetworkError(err)) return mockFallback()
    throw err
  }
}

export function login(username, password) {
  return requestOrMock(
    async () => (await api.post('/auth/login', { username, password })).data,
    () => {
      // Chế độ tĩnh: tài khoản demo đăng nhập bình thường; tài khoản khác vẫn cho vào
      // (giữ username đã nhập) để tiện trình bày báo cáo
      if (username === DEMO_USERNAME && password === DEMO_PASSWORD) {
        return { accessToken: 'mock_access_token_phamminhthien', user: getMockUser() }
      }
      return { accessToken: 'mock_access_token_demo', user: { ...getMockUser(), username } }
    }
  )
}

export function getMe() {
  return requestOrMock(async () => (await api.get('/auth/me')).data.user, getMockUser)
}

export function getLatestSensor() {
  return requestOrMock(
    async () => (await api.get('/sensor-data/latest', { params: { sensorCode: 'SENSOR_01' } })).data,
    getMockLatestSensor
  )
}

export function getChart(params = {}) {
  return requestOrMock(async () => (await api.get('/sensor-data/chart', { params })).data, () => getMockChart(params))
}

export function getDevices() {
  return requestOrMock(async () => (await api.get('/devices')).data.devices, getMockDevices)
}

export function controlDevice(deviceId, payload) {
  return requestOrMock(
    async () => (await api.post(`/devices/${deviceId}/control`, payload)).data,
    () => controlMockDevice(deviceId, payload)
  )
}

export function getSensorHistory(params = {}) {
  return requestOrMock(async () => (await api.get('/sensor-data', { params })).data, () => getMockSensorHistory(params))
}

export function getActionHistory(params = {}) {
  return requestOrMock(async () => (await api.get('/action-history', { params })).data, () => getMockActionHistory(params))
}
