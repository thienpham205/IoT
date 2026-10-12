// Thẻ số liệu trên Trang chủ: tên chỉ số + giá trị
export default function StatCard({ title, value }) {
  return (
    <div className="card stat-card">
      <div className="stat-title">{title}</div>
      <div className="stat-value">{value}</div>
    </div>
  )
}
