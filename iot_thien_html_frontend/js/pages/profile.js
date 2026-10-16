// Trang Hồ sơ - Dữ liệu động kết nối REST API

initLayout()

async function loadProfile() {
  try {
    const profile = await getProfile()
    if (!profile) return

    // Điền thông tin vào các thẻ có data-field="..."
    document.querySelectorAll('[data-field]').forEach((el) => {
      const field = el.dataset.field
      if (profile[field] !== undefined) {
        el.textContent = profile[field]
      }
    })

    const avatar = document.getElementById('avatar')
    if (avatar && profile.fullName) {
      avatar.textContent = initialOf(profile.fullName)
    }

    if (profile.githubLink) document.getElementById('link-github').href = profile.githubLink
    if (profile.figmaLink) document.getElementById('link-figma').href = profile.figmaLink
    if (profile.postmanLink) document.getElementById('link-postman').href = profile.postmanLink
    if (profile.pdfLink) document.getElementById('link-pdf').href = profile.pdfLink
  } catch (err) {
    console.error('[profile] load error:', err)
  }
}

loadProfile()

document.getElementById('logout').addEventListener('click', () => {
  logout()
  location.href = 'login.html'
})
