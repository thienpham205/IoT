// Trang chủ - Dữ liệu động kết nối REST API (1 đèn duy nhất)

initLayout()

// ---------- 3 thẻ số liệu ----------
async function loadLatestSensor() {
  try {
    const latest = await getLatestSensor()
    if (latest) {
      document.getElementById('stat-temperature').textContent = `${latest.temperature}°C`
      document.getElementById('stat-humidity').textContent = `${latest.humidity}%`
      document.getElementById('stat-light').textContent = `${latest.light} lux`
    }
  } catch (err) {
    console.error('[dashboard] loadLatestSensor error:', err)
  }
}

// ---------- Biểu đồ thời gian thực ----------
const LINE_STYLE = { tension: 0, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4 }
let chartInstance = null

function initChart(labels = [], series = {}) {
  const canvas = document.getElementById('chart')
  chartInstance = new Chart(canvas, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        { ...LINE_STYLE, label: 'Nhiệt độ (°C)', data: series.temperature || [], borderColor: '#6847ff', backgroundColor: '#6847ff', yAxisID: 'yTemp' },
        { ...LINE_STYLE, label: 'Độ ẩm (%)', data: series.humidity || [], borderColor: '#20b9b0', backgroundColor: '#20b9b0', yAxisID: 'yHum' },
        { ...LINE_STYLE, label: 'Độ sáng (lux)', data: series.light || [], borderColor: '#f3a11a', backgroundColor: '#f3a11a', yAxisID: 'yLight' }
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
}

async function loadChart() {
  try {
    const res = await getChartData(CHART_POINTS)
    const labels = res.labels || []
    const series = res.series || {}
    if (!chartInstance) {
      initChart(labels, series)
    } else {
      chartInstance.data.labels = labels
      chartInstance.data.datasets[0].data = series.temperature || []
      chartInstance.data.datasets[1].data = series.humidity || []
      chartInstance.data.datasets[2].data = series.light || []
      chartInstance.update()
    }
  } catch (err) {
    console.error('[dashboard] loadChart error:', err)
  }
}

// ---------- Điều khiển đèn (Chỉ 1 đèn duy nhất - LIGHT_01) ----------
let currentDevices = []
let isControlling = false
let devicesRequest = 0

// fromTimer = true: lượt làm mới định kỳ 5 giây
async function loadDevices(fromTimer = false) {
  const request = ++devicesRequest
  try {
    const devices = await getDevices()
    // Bỏ kết quả cũ (đã có lần tải mới hơn) và lượt làm mới định kỳ về đúng lúc đang bấm ON/OFF
    if (request !== devicesRequest || (fromTimer && isControlling)) return
    // Chỉ lấy 1 đèn khớp với phần cứng thật ESP8266 và báo cáo
    currentDevices = devices.slice(0, 1)
    renderDevices()
  } catch (err) {
    console.error('[dashboard] loadDevices error:', err)
  }
}

function renderDevices() {
  const container = document.getElementById('device-list')
  if (!currentDevices.length) {
    container.innerHTML = `
      <div class="device-card">
        <div class="device-copy">
          <strong>Đèn</strong>
        </div>
        <div class="device-status">Đang tải...</div>
      </div>`
    return
  }

  container.innerHTML = currentDevices
    .map((device) => {
      const isOn = device.status === 'ON'
      return `
        <div class="device-card">
          <div class="device-copy">
            <strong>${escapeHtml(device.deviceName || 'Đèn')}</strong>
          </div>
          <div class="device-status">${isOn ? 'Đang bật' : 'Đang tắt'}</div>
          <div class="device-actions">
            <button class="mode-button on ${isOn ? 'active' : ''}"
              data-id="${device.deviceId}" data-action="ON" ${isControlling ? 'disabled' : ''}>ON</button>
            <button class="mode-button off ${!isOn ? 'active' : ''}"
              data-id="${device.deviceId}" data-action="OFF" ${isControlling ? 'disabled' : ''}>OFF</button>
          </div>
        </div>`
    })
    .join('')
}

// Bấm nút ON / OFF điều khiển đèn qua REST API
document.getElementById('device-list').addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action]')
  if (!btn || isControlling) return
  const deviceId = Number(btn.dataset.id)
  const action = btn.dataset.action

  isControlling = true
  const target = currentDevices.find((d) => d.deviceId === deviceId)
  if (target) {
    target.status = action
    renderDevices()
  }

  try {
    const res = await setDeviceStatus(deviceId, action)
    await loadDevices()
    if (res.result !== 'SUCCESS') alert(`Điều khiển thất bại: ${res.message || 'Thiết bị không phản hồi'}`)
  } catch (err) {
    console.error('[dashboard] control failed:', err)
    alert(`Lỗi điều khiển thiết bị: ${err.message}`)
    await loadDevices()
  } finally {
    isControlling = false
    renderDevices()
  }
})

// Khởi chạy dữ liệu và chu kỳ làm mới tự động (realtime 5s).
// Trạng thái đèn cũng được làm mới để thấy thay đổi từ nơi khác (Postman, tab khác);
// bỏ qua khi đang chờ kết quả bấm ON/OFF để không ghi đè trạng thái đang hiển thị.
async function initDashboard() {
  await Promise.all([loadLatestSensor(), loadChart(), loadDevices()])
  setInterval(() => {
    loadLatestSensor()
    loadChart()
    if (!isControlling) loadDevices(true)
  }, 5000)
}

initDashboard()
