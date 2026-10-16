// Trang Lịch sử hoạt động - Dữ liệu động kết nối REST API

initLayout()

// Cột "Trạng thái": Thành công / Thất bại / Đang chờ + màu badge
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
  getPage: getActionPage,
  initialFilters: { deviceId: '', action: '', result: '', search: '' },
  tbody: document.getElementById('rows'),
  footer: document.getElementById('footer'),
  columns: 6,
  emptyText: 'Không có dữ liệu phù hợp.',
  renderRow: (row) => `
    <td class="technical-id">${row.historyId}</td>
    <td><strong>${escapeHtml(row.deviceName || 'Đèn')}</strong></td>
    <td>${row.action}</td>
    <td>${resultBadge(row.result)}</td>
    <td>${formatTime(row.actionTime)}</td>
    <td>${escapeHtml(row.userName || 'Phạm Minh Thiện')}</td>`
})

// Nạp danh sách thiết bị động từ Backend vào ô lọc THIẾT BỊ
async function populateDevices() {
  try {
    const devices = await getDevices()
    for (const d of devices) {
      deviceSelect.add(new Option(d.deviceName || 'Đèn', d.deviceId))
    }
  } catch (err) {
    console.error('[history] populateDevices error:', err)
  }
}
populateDevices()

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
