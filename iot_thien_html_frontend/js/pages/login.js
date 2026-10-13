// Trang Đăng nhập

// Đã đăng nhập rồi thì vào thẳng Trang chủ
if (isAuthenticated()) location.replace('index.html')

const form = document.getElementById('login-form')
const usernameInput = document.getElementById('username')
const passwordInput = document.getElementById('password')
const toggleButton = document.getElementById('toggle-password')
const submitButton = document.getElementById('submit')
const errorBox = document.getElementById('error')

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

// Gửi form: bấm nút hoặc nhấn Enter
form.addEventListener('submit', async (e) => {
  e.preventDefault() // không cho trình duyệt tải lại trang
  showError(errorBox, '')
  submitButton.disabled = true
  submitButton.textContent = 'Đang xác thực...'
  try {
    const data = await login(usernameInput.value, passwordInput.value)
    setAuth(data.accessToken, data.user)
    location.href = 'index.html'
  } catch (err) {
    showError(errorBox, err.message || 'Đăng nhập thất bại.')
  } finally {
    submitButton.disabled = false
    submitButton.textContent = 'Đăng nhập'
  }
})
