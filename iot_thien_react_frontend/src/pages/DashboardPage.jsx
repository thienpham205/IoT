import { Droplets, Lightbulb, Thermometer } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import DeviceControl from '../components/dashboard/DeviceControl'
import PageHeader from '../components/layout/PageHeader'
import SensorChart from '../components/dashboard/SensorChart'
import StatCard from '../components/common/StatCard'
import { getChart, getDevices, getLatestSensor } from '../services/iotService'

// live: 20 lần đo gần nhất, biểu đồ trượt sang trái mỗi khi có dữ liệu mới (2 giây/lần)
// 1h / 24h: gom trung bình theo phút / giờ trong khoảng thời gian gần nhất
const RANGES = {
  live: { label: 'Thời gian thực', title: 'Biểu đồ thời gian thực', params: () => ({ points: 20 }) },
  '1h': { label: '1 giờ', title: 'Biểu đồ 1 giờ gần nhất', params: () => ({ interval: '1m', from: new Date(Date.now() - 3600e3).toISOString() }) },
  '24h': { label: '24 giờ', title: 'Biểu đồ 24 giờ gần nhất', params: () => ({ interval: '1h', from: new Date(Date.now() - 86400e3).toISOString() }) }
}

export default function DashboardPage() {
  const [latest, setLatest] = useState(null)
  const [chart, setChart] = useState(null)
  const [devices, setDevices] = useState([])
  const [range, setRange] = useState('live')
  const [error, setError] = useState('')

  async function load() {
    try {
      const [latestData, chartData, deviceData] = await Promise.all([
        getLatestSensor(),
        getChart({ sensorCode: 'SENSOR_01', ...RANGES[range].params() }),
        getDevices()
      ])
      setError('')
      setLatest(latestData)
      setChart(chartData)
      setDevices(deviceData)
    } catch (e) {
      setError(e.message || 'Không tải được Dashboard.')
    }
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 2000)
    return () => clearInterval(id)
  }, [range])

  const time = useMemo(() => latest?.recordedAt ? new Date(latest.recordedAt).toLocaleString('vi-VN') : '--', [latest])

  function onConfirmed(deviceId, result) {
    setDevices((items) => items.map((d) => d.deviceId === deviceId ? { ...d, status: result.status, mode: result.mode, lastSeen: result.confirmedAt } : d))
  }

  return (
    <div className="page">
      <PageHeader
        title="Trang chủ"
        subtitle="Theo dõi dữ liệu cảm biến theo thời gian thực và điều khiển thiết bị"
      />

      {error ? <div className="page-error">{error}</div> : null}

      <div className="metric-grid">
        <StatCard icon={Thermometer} tone="purple" title="Nhiệt độ" value={latest ? `${latest.temperature}°C` : '--'} note={`Cập nhật: ${time}`} />
        <StatCard icon={Droplets} tone="cyan" title="Độ ẩm" value={latest ? `${latest.humidity}%` : '--'} />
        <StatCard icon={Lightbulb} tone="amber" title="Độ sáng" value={latest ? `${latest.light} lux` : '--'} />
      </div>

      <div className="dashboard-layout">
        <section className="card chart-card">
          <div className="card-heading">
            <div>
              <h3>{RANGES[range].title}</h3>
              <p>Nhiệt độ, độ ẩm và ánh sáng trên cùng mốc thời gian</p>
            </div>
            <select value={range} onChange={(e)=>setRange(e.target.value)} className="compact-select">
              {Object.entries(RANGES).map(([key, r]) => <option key={key} value={key}>{r.label}</option>)}
            </select>
          </div>
          <div className="chart-area"><SensorChart chart={chart} /></div>
        </section>

        <section className="card control-card">
          <div className="card-heading">
            <div>
              <h3>Điều khiển thiết bị</h3>
              <p>Đèn</p>
            </div>
          </div>
          <DeviceControl devices={devices} onConfirmed={onConfirmed} />
        </section>
      </div>
    </div>
  )
}
