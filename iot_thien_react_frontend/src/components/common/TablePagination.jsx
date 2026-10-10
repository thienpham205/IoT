// Các lựa chọn số dòng mỗi trang
const PAGE_SIZES = [5, 10, 20]

// Danh sách số trang hiển thị: luôn có trang đầu, trang cuối và 2 trang quanh trang hiện tại
function pageItems(current, total) {
  const pages = new Set([0, total - 1, current - 1, current, current + 1])
  const sorted = [...pages].filter((p) => p >= 0 && p < total).sort((a, b) => a - b)
  const items = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) items.push(`gap-${p}`)
    items.push(p)
  })
  return items
}

export default function TablePagination({ data, onPageChange, onSizeChange }) {
  const { page, size, totalElements, totalPages } = data
  const first = totalElements ? page * size + 1 : 0
  const last = Math.min((page + 1) * size, totalElements)

  return (
    <div className="table-footer">
      <div className="page-size">
        <span>Hiển thị</span>
        <select value={size} onChange={(e) => onSizeChange(Number(e.target.value))}>
          {PAGE_SIZES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <span>
          dòng/trang · {first}–{last} / {totalElements} bản ghi
        </span>
      </div>
      <div className="pagination">
        <button disabled={page <= 0} onClick={() => onPageChange(page - 1)}>
          Trước
        </button>
        {pageItems(page, totalPages).map((item) =>
          typeof item === 'string' ? (
            <span key={item} className="page-gap">
              …
            </span>
          ) : (
            <button key={item} className={item === page ? 'current' : ''} onClick={() => onPageChange(item)}>
              {item + 1}
            </button>
          )
        )}
        <button disabled={page >= totalPages - 1} onClick={() => onPageChange(page + 1)}>
          Sau
        </button>
      </div>
    </div>
  )
}
