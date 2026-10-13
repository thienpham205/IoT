// Trang chủ

initLayout()

// ---------- Biểu đồ ----------
// Đường thẳng nối các điểm, không bo cong, không vẽ chấm (chấm chỉ hiện khi rê chuột)
const LINE_STYLE = { tension: 0, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4 }

const chart = new Chart(document.getElementById('chart'), {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      { ...LINE_STYLE, label: 'Nhiệt độ (°C)', data: [], borderColor: '#6847ff', backgroundColor: '#6847ff', yAxisID: 'yTemp' },
      { ...LINE_STYLE, label: 'Độ ẩm (%)', data: [], borderColor: '#20b9b0', backgroundColor: '#20b9b0', yAxisID: 'yHum' },
      { ...LINE_STYLE, label: 'Độ sáng (lux)', data: [], borderColor: '#f3a11a', backgroundColor: '#f3a11a', yAxisID: 'yLight' }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: { usePointStyle: true, pointStyle: 'line', boxWidth: 20, font: { size: 11 } }
      },
      tooltip: { padding: 12 }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#8a96ad', font: { size: 10 } } },
      yTemp: { position: 'left', suggestedMin: 15, suggestedMax: 35, grid: { color: '#edf1f7' }, ticks: { color: '#6847ff', stepSize: 5 } },
      yHum: { position: 'right', suggestedMin: 40, suggestedMax: 90, grid: { drawOnChartArea: false }, ticks: { color: '#20b9b0', stepSize: 10 } },
      yLight: { position: 'right', suggestedMin: 0, suggestedMax: 600, grid: { drawOnChartArea: false }, ticks: { color: '#f3a11a', stepSize: 100 } }
    }
  }
})

function renderChart(data) {
  document.getElementById('chart-loading').hidden = true
  document.getElementById('chart').hidden = false
  chart.data.labels = data.labels
  chart.data.datasets[0].data = data.series.temperature
  chart.data.datasets[1].data = data.series.humidity
  chart.data.datasets[2].data = data.series.light
  chart.update()
}

// ---------- 3 thẻ số liệu ----------
function renderStats(latest) {
  document.getElementById('stat-temperature').textContent = `${latest.temperature}°C`
  document.getElementById('stat-humidity').textContent = `${latest.humidity}%`
  document.getElementById('stat-light').textContent = `${latest.light} lux`
}

// ---------- Điều khiển đèn ----------
// Chữ + màu badge theo trạng thái đèn
const STATUS_LABELS = {
  ON: { text: 'Đang bật', tone: 'bad' }, // đỏ
  OFF: { text: 'Đang tắt', tone: 'good' } // xanh
}

let devices = []
let pending = null // lệnh đang gửi: { deviceId, action } hoặc null

function statusBadge(device) {
  if (pending && pending.deviceId === device.deviceId) {
    return `<span class="status-badge warn"><i></i>${pending.action === 'ON' ? 'Đang bật...' : 'Đang tắt...'}</span>`
  }
  const { text, tone } = STATUS_LABELS[device.status] || { text: 'Không rõ', tone: 'neutral' }
  return `<span class="status-badge ${tone}"><i></i>${text}</span>`
}

function renderDevices() {
  document.getElementById('device-list').innerHTML = devices
    .map((device) => {
      const locked = pending && pending.deviceId === device.deviceId ? 'disabled' : ''
      const buttons = ['ON', 'OFF']
        .map((action) => `<button class="mode-button ${device.status === action ? 'active' : ''}"
          data-id="${device.deviceId}" data-action="${action}" ${locked}>${action}</button>`)
        .join('')
      return `
        <div class="device-card">
          <div class="device-copy">
            <strong>${escapeHtml(device.deviceName)}</strong>
            <span>${escapeHtml(device.location)}</span>
          </div>
          <div class="device-status"><span>Trạng thái:</span>${statusBadge(device)}</div>
          <div class="device-actions">${buttons}</div>
        </div>`
    })
    .join('')
}

// Bấm ON / OFF (một trình nghe cho cả danh sách, vì các nút được vẽ lại liên tục)
document.getElementById('device-list').addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action]')
  if (!btn || btn.disabled) return
  const deviceId = Number(btn.dataset.id)
  const action = btn.dataset.action
  const errorBox = document.getElementById('control-error')

  showError(errorBox, '')
  pending = { deviceId, action }
  renderDevices()
  try {
    const result = await controlDevice(deviceId, { action, mode: 'MANUAL' })
    if (result && result.result === 'FAILED') {
      showError(errorBox, result.message || 'Không nhận được ACK từ thiết bị trong thời gian chờ.')
    } else {
      // Cập nhật ngay trạng thái đèn vừa điều khiển, không chờ lần tải kế tiếp
      devices = devices.map((d) => (d.deviceId === deviceId ? { ...d, status: result.status } : d))
    }
  } catch (err) {
    showError(errorBox, err.message || 'Điều khiển thất bại.')
  } finally {
    pending = null
    renderDevices()
  }
})

// ---------- Tải dữ liệu mỗi REFRESH_MS ----------
async function load() {
  try {
    const [latest, chartData, deviceData] = await Promise.all([
      getLatestSensor(),
      getChart({ sensorCode: SENSOR_CODE, points: CHART_POINTS }),
      getDevices()
    ])
    showError(document.getElementById('error'), '')
    renderStats(latest)
    renderChart(chartData)
    devices = deviceData
    renderDevices()
  } catch (err) {
    showError(document.getElementById('error'), err.message || 'Không tải được Dashboard.')
  }
}

load()
setInterval(load, REFRESH_MS)
