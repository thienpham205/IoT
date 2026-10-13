// Gọi API backend bằng fetch

// Gửi request tới backend, tự gắn token. Lỗi mạng (backend tắt) thì đánh dấu isNetwork = true.
async function request(method, path, { params, body } = {}) {
  const url = new URL(API_URL + path)
  for (const [key, value] of Object.entries(params || {})) {
    if (value !== undefined && value !== null) url.searchParams.set(key, value)
  }

  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(12000) })
  } catch (err) {
    err.isNetwork = true // không kết nối được backend
    throw err
  }

  const data = await res.json().catch(() => null)
  if (res.status === 401) clearAuth() // token hết hạn / không hợp lệ
  if (!res.ok) throw new Error((data && data.message) || `Lỗi ${res.status}`)
  return data
}

// Gọi API thật; nếu không kết nối được backend thì trả dữ liệu mock (chế độ tĩnh).
// Lỗi từ backend (401, 400, 500...) vẫn được ném ra như bình thường.
async function requestOrMock(callApi, mockFallback) {
  try {
    return await callApi()
  } catch (err) {
    if (err.isNetwork) return mockFallback()
    throw err
  }
}

function login(username, password) {
  return requestOrMock(
    () => request('POST', '/auth/login', { body: { username, password } }),
    () => {
      // Chế độ tĩnh: tài khoản demo đăng nhập bình thường; tài khoản khác vẫn cho vào để tiện trình bày
      if (username === DEMO_ACCOUNT.username && password === DEMO_ACCOUNT.password) {
        return { accessToken: 'mock_access_token_phamminhthien', user: getMockUser() }
      }
      return { accessToken: 'mock_access_token_demo', user: { ...getMockUser(), username } }
    }
  )
}

function getMe() {
  return requestOrMock(async () => (await request('GET', '/auth/me')).user, getMockUser)
}

function getLatestSensor() {
  return requestOrMock(() => request('GET', '/sensor-data/latest', { params: { sensorCode: SENSOR_CODE } }), getMockLatestSensor)
}

function getChart(params) {
  return requestOrMock(() => request('GET', '/sensor-data/chart', { params }), getMockChart)
}

function getDevices() {
  return requestOrMock(async () => (await request('GET', '/devices')).devices, getMockDevices)
}

function controlDevice(deviceId, payload) {
  return requestOrMock(
    () => request('POST', `/devices/${deviceId}/control`, { body: payload }),
    () => controlMockDevice(deviceId, payload)
  )
}

function getSensorHistory(params) {
  return requestOrMock(() => request('GET', '/sensor-data', { params }), () => getMockSensorHistory(params))
}

function getActionHistory(params) {
  return requestOrMock(() => request('GET', '/action-history', { params }), () => getMockActionHistory(params))
}
