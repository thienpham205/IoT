const pad = (n) => String(n).padStart(2, '0')

// dd/MM/yyyy HH:mm:ss - trùng định dạng backend dùng khi tìm kiếm theo thời gian
export function formatTime(value) {
  if (!value) return '--'
  const d = new Date(value)
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
