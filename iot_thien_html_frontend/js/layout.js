// Phần dùng chung của các trang sau đăng nhập.
// Sidebar và topbar viết sẵn trong từng file .html; file này chỉ điền avatar + đồng hồ.

function initLayout() {
  requireLogin()

  const avatar = document.querySelector('.mini-avatar')
  if (avatar) avatar.textContent = initialOf(getUser()?.fullName)

  const clock = document.getElementById('clock')
  const tick = () => {
    if (clock) clock.textContent = formatClock(new Date())
  }
  tick()
  setInterval(tick, 30000)
}

// Hiện / ẩn khung lỗi đỏ (class page-error hoặc inline-error)
function showError(element, message) {
  element.textContent = message || ''
  element.hidden = !message
}
