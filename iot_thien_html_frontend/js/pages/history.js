// Trang Lịch sử hoạt động

initLayout()

// Cột "Trạng thái": đang chờ ACK / thất bại / trạng thái ON-OFF đã xác nhận
function actionStatus(row) {
  if (row.result === 'PENDING') return '<span class="status-badge warn"><i></i>Đang chờ ACK</span>'
  if (row.result === 'FAILED') return '<span class="status-badge bad"><i></i>Thất bại</span>'
  return `<span class="status-badge ${row.action === 'ON' ? 'good' : 'neutral'}"><i></i>${row.action}</span>`
}

// Cột "Kết quả": nhãn tiếng Việt + màu
const RESULTS = {
  SUCCESS: { label: 'Thành công', tone: 'good' },
  FAILED: { label: 'Thất bại', tone: 'bad' },
  PENDING: { label: 'Đang chờ', tone: 'warn' }
}
function resultBadge(result) {
  const { label, tone } = RESULTS[result] || { label: result, tone: 'neutral' }
  return `<span class="status-badge ${tone}"><i></i>${escapeHtml(label)}</span>`
}

const deviceSelect = document.getElementById('device')
const actionSelect = document.getElementById('action')
const resultSelect = document.getElementById('result')
const searchInput = document.getElementById('search')

const table = createPagedTable({
  // Ô tìm kiếm của trang này luôn tìm theo thời gian
  fetchPage: (params) => getActionHistory({ ...params, searchField: 'time' }),
  initialFilters: { deviceId: '', action: '', result: '', search: '' },
  tbody: document.getElementById('rows'),
  footer: document.getElementById('footer'),
  errorBox: document.getElementById('error'),
  columns: 7,
  emptyText: 'Không có dữ liệu phù hợp.',
  renderRow: (row) => `
    <td class="technical-id">${row.historyId}</td>
    <td><strong>${escapeHtml(row.deviceName)}</strong></td>
    <td>${row.action}</td>
    <td>${actionStatus(row)}</td>
    <td>${resultBadge(row.result)}</td>
    <td>${formatTime(row.actionTime)}</td>
    <td>${escapeHtml(row.userName)}</td>`
})

// Thêm các thiết bị vào ô lọc THIẾT BỊ; lỗi thì ô chỉ còn "Tất cả thiết bị"
getDevices()
  .then((devices) => {
    for (const d of devices) deviceSelect.add(new Option(d.deviceName, d.deviceId))
  })
  .catch(() => {})

document.getElementById('filter-form').addEventListener('submit', (e) => {
  e.preventDefault()
  table.applyFilters({
    deviceId: deviceSelect.value,
    action: actionSelect.value,
    result: resultSelect.value,
    search: searchInput.value.trim()
  })
})

document.getElementById('reset').addEventListener('click', () => {
  deviceSelect.value = ''
  actionSelect.value = ''
  resultSelect.value = ''
  searchInput.value = ''
  table.applyFilters({ deviceId: '', action: '', result: '', search: '' })
})
