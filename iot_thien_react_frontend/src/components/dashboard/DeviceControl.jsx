import { Fan, Lightbulb, Snowflake, LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { controlDevice } from '../../services/iotService'

const iconMap = {
  FAN: Fan,
  LIGHT: Lightbulb,
  AC: Snowflake
}

export default function DeviceControl({ devices, onConfirmed }) {
  const [pendingId, setPendingId] = useState(null)
  const [error, setError] = useState('')

  async function handleControl(device, action) {
    setError('')
    setPendingId(device.deviceId)
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
      setPendingId(null)
    }
  }

  return (
    <div>
      {error ? <div className="inline-error">{error}</div> : null}
      <div className="device-list">
        {devices.map((device) => {
          const Icon = iconMap[device.deviceType] || Fan
          const pending = pendingId === device.deviceId
          return (
            <div className="device-card" key={device.deviceId}>
              <div className={`device-icon ${device.deviceType.toLowerCase()}`}><Icon size={23} /></div>
              <div className="device-copy">
                <strong>{device.deviceName}</strong>
                <span>{device.location}</span>
              </div>
              <div className="device-actions">
                {['ON','OFF'].map((action) => (
                  <button
                    key={action}
                    disabled={pending}
                    className={`mode-button ${device.status === action ? 'active' : ''}`}
                    onClick={() => handleControl(device, action)}
                  >
                    {pending ? <LoaderCircle className="spin" size={14} /> : null}
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
