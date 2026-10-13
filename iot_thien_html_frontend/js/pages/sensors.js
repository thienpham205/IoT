// Trang Cảm biến

initLayout()

// Tên hiển thị theo loại cảm biến (backend trả "Cảm biến ..." nên đổi lại cho ngắn)
const SENSOR_NAMES = { temperature: 'Nhiệt độ', humidity: 'Độ ẩm', light: 'Ánh sáng' }

const typeSelect = document.getElementById('type')
const searchInput = document.getElementById('search')

// Đổi bộ lọc trên giao diện sang tham số API /sensor-data.
// "time" không phải loại cảm biến: chọn nó để ô bên cạnh tìm theo thời gian.
function fetchSensorPage({ type, search, ...rest }) {
  const byTime = type === 'time'
  return getSensorHistory({
    ...rest,
    search,
    type: byTime ? '' : type,
    searchField: byTime ? 'time' : search ? 'value' : 'all'
  })
}

const table = createPagedTable({
  fetchPage: fetchSensorPage,
  initialFilters: { type: '', search: '', sort: 'recordedAt,desc' },
  tbody: document.getElementById('rows'),
  footer: document.getElementById('footer'),
  errorBox: document.getElementById('error'),
  columns: 4,
  emptyText: 'Không có bản ghi phù hợp.',
  renderRow: (row) => `
    <td class="technical-id">${row.dataId}</td>
    <td>${SENSOR_NAMES[row.sensorType] || escapeHtml(row.sensorName)}</td>
    <td>${row.value} ${row.unit}</td>
    <td>${formatTime(row.recordedAt)}</td>`
})

// Chọn "Thời gian" thì đổi nhãn + gợi ý của 2 ô ngay (chưa cần bấm Tìm kiếm)
function updateLabels() {
  const byTime = typeSelect.value === 'time'
  document.getElementById('type-label').textContent = byTime ? 'TÌM THEO' : 'LOẠI CẢM BIẾN'
  document.getElementById('search-label').textContent = byTime ? 'THỜI GIAN' : 'GIÁ TRỊ'
  searchInput.placeholder = byTime ? 'Nhập thời gian (VD: 07/10/2026 hoặc 10:30)...' : 'Nhập giá trị cần tìm...'
}
typeSelect.addEventListener('change', updateLabels)

// Tìm kiếm: lấy giá trị đang chọn/gõ và áp bộ lọc
document.getElementById('filter-form').addEventListener('submit', (e) => {
  e.preventDefault()
  table.applyFilters({ type: typeSelect.value, search: searchInput.value.trim() })
})

// Đặt lại: xoá ô lọc và bỏ bộ lọc
document.getElementById('reset').addEventListener('click', () => {
  typeSelect.value = ''
  searchInput.value = ''
  updateLabels()
  table.applyFilters({ type: '', search: '' })
})
