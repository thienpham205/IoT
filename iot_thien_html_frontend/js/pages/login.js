// Trang Đăng nhập

// Đã đăng nhập rồi thì vào thẳng Trang chủ
if (isLoggedIn()) {
  location.replace('dashboard.html')
}

const usernameInput = document.getElementById('username')
const passwordInput = document.getElementById('password')
const toggleButton = document.getElementById('toggle-password')
const errorBox = document.getElementById('error')
const submitBtn = document.getElementById('submit')

// Điền sẵn tài khoản demo
usernameInput.value = DEMO_ACCOUNT.username
usernameInput.placeholder = DEMO_ACCOUNT.username
passwordInput.value = DEMO_ACCOUNT.password
document.getElementById('demo-hint').innerHTML =
  `Tài khoản demo: <b>${DEMO_ACCOUNT.username}</b> / <b>${DEMO_ACCOUNT.password}</b>`

// Nút Hiện / Ẩn mật khẩu
toggleButton.addEventListener('click', () => {
  const showing = passwordInput.type === 'text'
  passwordInput.type = showing ? 'password' : 'text'
  toggleButton.textContent = showing ? 'Hiện' : 'Ẩn'
})

// Gửi form đăng nhập qua API backend
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault()
  showError(errorBox, '')
  submitBtn.disabled = true
  submitBtn.textContent = 'Đang đăng nhập...'

  try {
    const res = await login(usernameInput.value.trim(), passwordInput.value)
    if (res.success) {
      location.href = 'dashboard.html'
    } else {
      showError(errorBox, res.message || 'Tên đăng nhập hoặc mật khẩu không đúng')
    }
  } catch (err) {
    showError(errorBox, err.message || 'Lỗi kết nối máy chủ')
  } finally {
    submitBtn.disabled = false
    submitBtn.textContent = 'Đăng nhập'
  }
})
