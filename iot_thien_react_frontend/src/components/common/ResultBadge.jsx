// Nhãn tiếng Việt và màu cho kết quả điều khiển thiết bị (cột "Kết quả")
const RESULTS = {
  SUCCESS: { label: 'Thành công', tone: 'good' },
  FAILED: { label: 'Thất bại', tone: 'bad' },
  PENDING: { label: 'Đang chờ', tone: 'warn' }
}

export default function ResultBadge({ result }) {
  const { label, tone } = RESULTS[result] ?? { label: result, tone: 'neutral' }
  return (
    <span className={`status-badge ${tone}`}>
      <i />
      {label}
    </span>
  )
}
