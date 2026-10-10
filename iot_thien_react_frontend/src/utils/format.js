const pad = (n) => String(n).padStart(2, '0')

// dd/MM/yyyy HH:mm:ss - trùng định dạng backend dùng khi tìm kiếm theo thời gian
export function formatTime(value) {
  if (!value) return '--'
  const d = new Date(value)
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// HH:mm (24 giờ) - đồng hồ trên thanh trên cùng
export function formatClock(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// Chữ cái đầu của tên (từ cuối trong họ tên), dùng cho avatar: "Phạm Minh Thiện" -> "T"
export function initialOf(fullName) {
  const name = String(fullName || '')
    .trim()
    .split(/\s+/)
    .pop()
  return name ? name[0].toUpperCase() : '?'
}
