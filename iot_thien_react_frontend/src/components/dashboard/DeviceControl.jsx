import { useState } from 'react'
import { controlDevice } from '../../services/iotService'

// Dòng "Trạng thái" trên thẻ thiết bị: chữ + màu badge theo trạng thái đèn
const STATUS_LABELS = {
  ON: { text: 'Đang bật', tone: 'good' },
  OFF: { text: 'Đang tắt', tone: 'neutral' }
}

function DeviceStatus({ status, pendingAction }) {
  // Vừa bấm nút, đang chờ backend trả lời
  if (pendingAction) {
    return (
      <span className="status-badge warn">
        <i />
        {pendingAction === 'ON' ? 'Đang bật...' : 'Đang tắt...'}
      </span>
    )
  }
  const { text, tone } = STATUS_LABELS[status] ?? { text: 'Không rõ', tone: 'neutral' }
  return (
    <span className={`status-badge ${tone}`}>
      <i />
      {text}
    </span>
  )
}

export default function DeviceControl({ devices, onConfirmed }) {
  // Lệnh đang gửi: { deviceId, action } hoặc null
  const [pending, setPending] = useState(null)
  const [error, setError] = useState('')

  async function handleControl(device, action) {
    setError('')
    setPending({ deviceId: device.deviceId, action })
    try {
      const result = await controlDevice(device.deviceId, { action, mode: 'MANUAL' })
      if (result?.result === 'FAILED') {
        setError(result.message || 'Không nhận được ACK từ thiết bị trong thời gian chờ.')
        return
      }
      onConfirmed?.(device.deviceId, result)
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Điều khiển thất bại.')
    } finally {
      setPending(null)
    }
  }

  return (
    <div>
      {error ? <div className="inline-error">{error}</div> : null}
      <div className="device-list">
        {devices.map((device) => {
          const pendingAction = pending?.deviceId === device.deviceId ? pending.action : null
          return (
            <div className="device-card" key={device.deviceId}>
              <div className="device-copy">
                <strong>{device.deviceName}</strong>
                <span>{device.location}</span>
              </div>
              <div className="device-status">
                <span>Trạng thái:</span>
                <DeviceStatus status={device.status} pendingAction={pendingAction} />
              </div>
              <div className="device-actions">
                {['ON', 'OFF'].map((action) => (
                  <button
                    key={action}
                    disabled={Boolean(pendingAction)}
                    className={`mode-button ${device.status === action ? 'active' : ''}`}
                    onClick={() => handleControl(device, action)}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
