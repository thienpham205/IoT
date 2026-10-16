// Đăng nhập / đăng xuất: lưu JWT token và thông tin người dùng trong localStorage

const TOKEN_KEY = 'iot_thien_token'
const USER_KEY = 'iot_thien_user'

// Đăng nhập qua REST API của Backend
async function login(username, password) {
  try {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    })
    if (res.accessToken) {
      localStorage.setItem(TOKEN_KEY, res.accessToken)
      localStorage.setItem(USER_KEY, JSON.stringify(res.user))
      return { success: true, user: res.user }
    }
    return { success: false, message: 'Không nhận được mã xác thực token' }
  } catch (err) {
    return { success: false, message: err.message || 'Tên đăng nhập hoặc mật khẩu không đúng' }
  }
}

function logout() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null')
  } catch {
    return null
  }
}

function isLoggedIn() {
  return Boolean(getToken())
}

// Đặt ở đầu các trang cần đăng nhập: chưa đăng nhập thì chuyển về trang Đăng nhập
function requireLogin() {
  if (!isLoggedIn()) {
    location.replace('login.html')
  }
}
