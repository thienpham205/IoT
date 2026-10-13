// Lưu / đọc thông tin đăng nhập trong localStorage

const TOKEN_KEY = 'iot_thien_access_token'
const USER_KEY = 'iot_thien_user'

function setAuth(accessToken, user) {
  localStorage.setItem(TOKEN_KEY, accessToken)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

function clearAuth() {
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

function isAuthenticated() {
  return Boolean(getToken())
}

// Đặt ở đầu các trang cần đăng nhập: chưa có token thì chuyển về trang Đăng nhập
function requireLogin() {
  if (!isAuthenticated()) location.replace('login.html')
}
