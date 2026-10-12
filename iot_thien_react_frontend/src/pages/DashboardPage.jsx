import { useEffect, useState } from 'react'
import StatCard from '../components/common/StatCard'
import DeviceControl from '../components/dashboard/DeviceControl'
import SensorChart from '../components/dashboard/SensorChart'
import PageHeader from '../components/layout/PageHeader'
import { SENSOR_CODE } from '../constants'
import { getChart, getDevices, getLatestSensor } from '../services/iotService'

const REFRESH_MS = 2000

// Biểu đồ thời gian thực: 20 lần đo gần nhất, trượt sang trái mỗi khi có dữ liệu mới
const CHART_POINTS = 20

export default function DashboardPage() {
  const [latest, setLatest] = useState(null)
  const [chart, setChart] = useState(null)
  const [devices, setDevices] = useState([])
  const [error, setError] = useState('')

  // Tải lại số liệu, biểu đồ và trạng thái thiết bị mỗi REFRESH_MS
  useEffect(() => {
    async function load() {
      try {
        const [latestData, chartData, deviceData] = await Promise.all([
          getLatestSensor(),
          getChart({ sensorCode: SENSOR_CODE, points: CHART_POINTS }),
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
    load()
    const id = setInterval(load, REFRESH_MS)
    return () => clearInterval(id)
  }, [])

  // Cập nhật ngay trạng thái thiết bị vừa điều khiển, không chờ lần tải kế tiếp
  function onConfirmed(deviceId, result) {
    setDevices((items) => items.map((d) => (d.deviceId === deviceId ? { ...d, status: result.status } : d)))
  }

  return (
    <div className="page">
      <PageHeader title="Trang chủ" subtitle="Theo dõi dữ liệu cảm biến theo thời gian thực và điều khiển thiết bị" />

      {error ? <div className="page-error">{error}</div> : null}

      <div className="metric-grid">
        <StatCard title="Nhiệt độ" value={latest ? `${latest.temperature}°C` : '--'} />
        <StatCard title="Độ ẩm" value={latest ? `${latest.humidity}%` : '--'} />
        <StatCard title="Độ sáng" value={latest ? `${latest.light} lux` : '--'} />
      </div>

      <div className="dashboard-layout">
        <section className="card chart-card">
          <div className="card-heading">
            <div>
              <h3>Biểu đồ thời gian thực</h3>
              <p>Nhiệt độ, độ ẩm và ánh sáng trên cùng mốc thời gian</p>
            </div>
          </div>
          <div className="chart-area">
            <SensorChart chart={chart} />
          </div>
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
