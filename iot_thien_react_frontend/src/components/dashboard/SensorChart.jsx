import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

// Đường thẳng nối các điểm, không bo cong, không vẽ chấm (chấm chỉ hiện khi rê chuột)
const LINE_STYLE = { tension: 0, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4 }

export default function SensorChart({ chart }) {
  if (!chart) return <div className="loading-block">Đang tải biểu đồ...</div>

  const data = {
    labels: chart.labels,
    datasets: [
      {
        ...LINE_STYLE,
        label: 'Nhiệt độ (°C)',
        data: chart.series.temperature,
        borderColor: '#6847ff',
        backgroundColor: '#6847ff',
        yAxisID: 'yTemp'
      },
      {
        ...LINE_STYLE,
        label: 'Độ ẩm (%)',
        data: chart.series.humidity,
        borderColor: '#20b9b0',
        backgroundColor: '#20b9b0',
        yAxisID: 'yHum'
      },
      {
        ...LINE_STYLE,
        label: 'Độ sáng (lux)',
        data: chart.series.light,
        borderColor: '#f3a11a',
        backgroundColor: '#f3a11a',
        yAxisID: 'yLight'
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        // Chú thích dạng gạch ngang giống nét vẽ của đường
        labels: { usePointStyle: true, pointStyle: 'line', boxWidth: 20, font: { size: 11 } }
      },
      tooltip: { padding: 12 }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#8a96ad', font: { size: 10 } } },
      yTemp: {
        position: 'left',
        suggestedMin: 15,
        suggestedMax: 35,
        grid: { color: '#edf1f7' },
        ticks: { color: '#6847ff', stepSize: 5 }
      },
      yHum: {
        position: 'right',
        suggestedMin: 40,
        suggestedMax: 90,
        grid: { drawOnChartArea: false },
        ticks: { color: '#20b9b0', stepSize: 10 }
      },
      // Trục Độ sáng: bên phải, cạnh trục Độ ẩm; số màu cam khớp màu đường
      yLight: {
        position: 'right',
        suggestedMin: 0,
        suggestedMax: 600,
        grid: { drawOnChartArea: false },
        ticks: { color: '#f3a11a', stepSize: 100 }
      }
    }
  }

  return <Line data={data} options={options} />
}
