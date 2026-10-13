// Bảng dữ liệu có phân trang, dùng chung cho trang Cảm biến và Lịch sử hoạt động

// Danh sách số trang hiển thị: luôn có trang đầu, trang cuối và 2 trang quanh trang hiện tại
function pageItems(current, total) {
  const pages = [...new Set([0, total - 1, current - 1, current, current + 1])]
    .filter((p) => p >= 0 && p < total)
    .sort((a, b) => a - b)
  const items = []
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) items.push('gap')
    items.push(p)
  })
  return items
}

// Vẽ chân bảng: ô chọn số dòng/trang + dãy nút trang
function renderPagination(footer, data) {
  const { page, size, totalElements, totalPages } = data
  const first = totalElements ? page * size + 1 : 0
  const last = Math.min((page + 1) * size, totalElements)
  const sizeOptions = PAGE_SIZES.map((s) => `<option value="${s}" ${s === size ? 'selected' : ''}>${s}</option>`).join('')
  const pageButtons = pageItems(page, totalPages)
    .map((item) =>
      item === 'gap'
        ? '<span class="page-gap">…</span>'
        : `<button data-page="${item}" class="${item === page ? 'current' : ''}">${item + 1}</button>`
    )
    .join('')

  footer.innerHTML = `
    <div class="page-size">
      <span>Hiển thị</span>
      <select data-role="size">${sizeOptions}</select>
      <span>dòng/trang · ${first}–${last} / ${totalElements} bản ghi</span>
    </div>
    <div class="pagination">
      <button data-page="${page - 1}" ${page <= 0 ? 'disabled' : ''}>Trước</button>
      ${pageButtons}
      <button data-page="${page + 1}" ${page >= totalPages - 1 ? 'disabled' : ''}>Sau</button>
    </div>`
}

// Tạo một bảng có phân trang.
//   fetchPage(params)   : hàm lấy dữ liệu, trả { content, page, size, totalElements, totalPages }
//   initialFilters      : bộ lọc ban đầu
//   tbody, footer       : thẻ <tbody> và <div class="table-footer"> trên trang
//   errorBox            : khung báo lỗi
//   columns             : số cột (cho dòng "đang tải" / "không có dữ liệu")
//   renderRow(row)      : trả về chuỗi HTML các ô <td> của một dòng
//   emptyText           : chữ khi không có dòng nào
// Trả về { applyFilters, reload }.
function createPagedTable({ fetchPage, initialFilters, tbody, footer, errorBox, columns, renderRow, emptyText }) {
  let params = { page: 0, size: 10, ...initialFilters }
  let data = { content: [], page: 0, size: 10, totalElements: 0, totalPages: 1 }
  let requestId = 0 // bỏ qua kết quả của lần tải cũ nếu đã có lần tải mới hơn

  const fullWidthRow = (text) => `<tr><td colspan="${columns}" class="table-empty">${text}</td></tr>`

  function renderBody(loading) {
    if (loading) tbody.innerHTML = fullWidthRow('Đang tải dữ liệu...')
    else if (!data.content.length) tbody.innerHTML = fullWidthRow(emptyText)
    else tbody.innerHTML = data.content.map((row) => `<tr>${renderRow(row)}</tr>`).join('')
    renderPagination(footer, data)
  }

  async function load() {
    const id = ++requestId
    renderBody(true)
    try {
      const result = await fetchPage(params)
      if (id !== requestId) return
      data = result
      showError(errorBox, '')
    } catch (err) {
      if (id !== requestId) return
      showError(errorBox, err.message || 'Không tải được dữ liệu.')
    }
    renderBody(false)
  }

  // Bấm nút trang / đổi số dòng mỗi trang
  footer.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-page]')
    if (!btn || btn.disabled) return
    params = { ...params, page: Number(btn.dataset.page) }
    load()
  })
  footer.addEventListener('change', (e) => {
    if (e.target.dataset.role !== 'size') return
    params = { ...params, size: Number(e.target.value), page: 0 }
    load()
  })

  load()
  return {
    // Áp bộ lọc mới và quay về trang đầu
    applyFilters(filters) {
      params = { ...params, ...filters, page: 0 }
      load()
    },
    reload: load
  }
}
