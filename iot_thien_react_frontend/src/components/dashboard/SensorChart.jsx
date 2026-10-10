import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

export default function SensorChart({ chart }) {
  if (!chart) return <div className="loading-block">Đang tải biểu đồ...</div>

  const data = {
    labels: chart.labels,
    datasets: [
      {
        label: 'Nhiệt độ (°C)',
        data: chart.series.temperature,
        borderColor: '#6847ff',
        backgroundColor: 'rgba(104,71,255,.08)',
        tension: 0.45,
        pointRadius: 2,
        pointHoverRadius: 5,
        yAxisID: 'yTemp'
      },
      {
        label: 'Độ ẩm (%)',
        data: chart.series.humidity,
        borderColor: '#20b9b0',
        backgroundColor: 'rgba(32,185,176,.08)',
        tension: 0.45,
        pointRadius: 2,
        pointHoverRadius: 5,
        yAxisID: 'yHum'
      },
      {
        label: 'Độ sáng (lux)',
        data: chart.series.light,
        borderColor: '#f3a11a',
        backgroundColor: 'rgba(243,161,26,.08)',
        tension: 0.45,
        pointRadius: 2,
        pointHoverRadius: 5,
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
        labels: { usePointStyle: true, boxWidth: 8, font: { size: 11 } }
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
      yLight: {
        display: false,
        suggestedMin: 0,
        suggestedMax: 600
      }
    }
  }

  return <Line data={data} options={options} />
}
