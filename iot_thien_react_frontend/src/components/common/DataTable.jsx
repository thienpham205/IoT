// Bảng dữ liệu trong thẻ card: tự hiển thị dòng "đang tải" / "không có dữ liệu".
// renderRow(row) trả về các <td> của một dòng; footer thường là <TablePagination />.
export default function DataTable({ headers, rows, loading, rowKey, renderRow, emptyText, footer }) {
  const fullWidthRow = (text) => (
    <tr><td colSpan={headers.length} className="table-empty">{text}</td></tr>
  )

  let body
  if (loading) body = fullWidthRow('Đang tải dữ liệu...')
  else if (!rows.length) body = fullWidthRow(emptyText)
  else body = rows.map((row) => <tr key={rowKey(row)}>{renderRow(row)}</tr>)

  return (
    <section className="card table-card">
      <div className="responsive-table">
        <table>
          <thead>
            <tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>{body}</tbody>
        </table>
      </div>
      {footer}
    </section>
  )
}
