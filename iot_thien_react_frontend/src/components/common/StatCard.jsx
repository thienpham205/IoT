export default function StatCard({ icon: Icon, tone = 'purple', title, value, note }) {
  return (
    <div className="card stat-card">
      <div className={`stat-icon ${tone}`}>
        <Icon size={25} />
      </div>
      <div>
        <div className="stat-title">{title}</div>
        <div className="stat-value">{value}</div>
        {note ? <div className="stat-note">{note}</div> : null}
      </div>
    </div>
  )
}
