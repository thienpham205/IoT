// Thanh lọc phía trên bảng: các ô lọc + nút Tìm kiếm / Đặt lại
export default function FilterToolbar({ onSearch, onReset, children }) {
  function handleSubmit(e) {
    e.preventDefault()
    onSearch()
  }

  return (
    <form className="filter-toolbar" onSubmit={handleSubmit}>
      {children}
      <div className="filter-buttons">
        <button type="submit" className="search-btn">Tìm kiếm</button>
        <button type="button" className="reset-btn" onClick={onReset}>Đặt lại</button>
      </div>
    </form>
  )
}

// Một ô lọc có nhãn
export function FilterField({ label, children }) {
  return (
    <div className="filter-item">
      <label>{label}</label>
      {children}
    </div>
  )
}

// Ô chọn trong thanh lọc. options: [{ value, label }]
export function FilterSelect({ value, onChange, options }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}
