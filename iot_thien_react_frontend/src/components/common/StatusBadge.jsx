export default function StatusBadge({ value }) {
  const key = String(value || '').toUpperCase()
  const tone = ['NORMAL','SUCCESS','ACTIVE','ON'].includes(key)
    ? 'good'
    : ['WARNING','PENDING','AUTO'].includes(key)
      ? 'warn'
      : ['FAILED','OFF'].includes(key)
        ? 'bad'
        : 'neutral'
  return <span className={`status-badge ${tone}`}><i />{value}</span>
}
