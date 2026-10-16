// Bảng dữ liệu có phân trang động, dùng chung cho trang Cảm biến và Lịch sử hoạt động

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

// Tạo một bảng có phân trang bất đồng bộ kết nối REST API.
//   getPage(params)     : hàm gọi API (async), trả { content, page, size, totalElements, totalPages }
//   initialFilters      : bộ lọc ban đầu
//   tbody, footer       : thẻ <tbody> và <div class="table-footer"> trên trang
//   columns             : số cột (cho dòng "không có dữ liệu")
//   renderRow(row)      : trả về chuỗi HTML các ô <td> của một dòng
//   emptyText           : chữ khi không có dòng nào
// Trả về { applyFilters, refresh }.
function createPagedTable({ getPage, initialFilters, tbody, footer, columns, renderRow, emptyText }) {
  let params = { page: 0, size: 10, ...initialFilters }
  let loading = false

  async function render() {
    if (loading) return
    loading = true
    tbody.innerHTML = `<tr><td colspan="${columns}" class="table-empty">Đang tải dữ liệu từ máy chủ...</td></tr>`
    try {
      const data = await getPage(params)
      const list = data?.content || []
      tbody.innerHTML = list.length
        ? list.map((row) => `<tr>${renderRow(row)}</tr>`).join('')
        : `<tr><td colspan="${columns}" class="table-empty">${emptyText}</td></tr>`
      renderPagination(footer, data || { page: 0, size: params.size, totalElements: 0, totalPages: 0 })
    } catch (err) {
      console.error('[table] load error:', err)
      tbody.innerHTML = `<tr><td colspan="${columns}" class="table-empty" style="color: #ea3943;">Không thể tải dữ liệu: ${err.message || 'Lỗi kết nối máy chủ'}</td></tr>`
    } finally {
      loading = false
    }
  }

  // Bấm nút trang / đổi số dòng mỗi trang
  footer.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-page]')
    if (!btn || btn.disabled) return
    params = { ...params, page: Number(btn.dataset.page) }
    render()
  })
  footer.addEventListener('change', (e) => {
    if (e.target.dataset.role !== 'size') return
    params = { ...params, size: Number(e.target.value), page: 0 }
    render()
  })

  render()
  return {
    applyFilters(filters) {
      params = { ...params, ...filters, page: 0 }
      render()
    },
    refresh() {
      render()
    }
  }
}
