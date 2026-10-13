// Trang Hồ sơ (tương ứng pages/ProfilePage.jsx)

initLayout()

// File tĩnh trong thư mục files/, dùng khi CSDL chưa có link
const POSTMAN_FILE = 'files/IOT_Thien_API.postman_collection.json'
const PDF_FILE = 'files/Pham_Minh_Thien_B23DCAT285_IOT_Report.pdf'

// Giá trị hiển thị khi chưa tải được thông tin người dùng
const DEFAULT_USER = {
  username: 'phamminhthien',
  fullName: 'Phạm Minh Thiện',
  studentId: 'B23DCAT285',
  email: 'phamminhthien@ptit.edu.vn',
  role: 'USER'
}

// Link file tĩnh do backend lưu dạng "/files/..." -> đổi thành đường dẫn tương đối của bản HTML
const localFile = (link, fallback) => (link ? link.replace(/^\/files\//, 'files/') : fallback)

function renderProfile(user) {
  const show = (key) => (user && user[key]) || DEFAULT_USER[key]
  document.querySelectorAll('[data-field]').forEach((el) => {
    el.textContent = show(el.dataset.field)
  })
  document.getElementById('avatar').textContent = initialOf(show('fullName'))
  document.getElementById('link-github').href = (user && user.githubLink) || '#'
  document.getElementById('link-figma').href = (user && user.figmaLink) || '#'
  document.getElementById('link-postman').href = localFile(user && user.postmanLink, POSTMAN_FILE)
  document.getElementById('link-pdf').href = localFile(user && user.pdfLink, PDF_FILE)
}

// Hiện ngay thông tin đã lưu lúc đăng nhập, rồi cập nhật bằng dữ liệu mới nhất từ backend
renderProfile(getUser())
getMe()
  .then(renderProfile)
  .catch(() => {})

document.getElementById('logout').addEventListener('click', () => {
  clearAuth()
  location.href = 'login.html'
})
