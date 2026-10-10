import { useState } from 'react'
import DataTable from '../components/common/DataTable'
import FilterToolbar, { FilterField, FilterSelect } from '../components/common/FilterToolbar'
import TablePagination from '../components/common/TablePagination'
import PageHeader from '../components/layout/PageHeader'
import { usePagedData } from '../hooks/usePagedData'
import { getSensorHistory } from '../services/iotService'
import { formatTime } from '../utils/format'

// Tên hiển thị theo loại cảm biến (backend vẫn trả "Cảm biến ..." nên map lại ở FE)
const SENSOR_NAMES = { temperature: 'Nhiệt độ', humidity: 'Độ ẩm', light: 'Ánh sáng' }

// "time" không phải loại cảm biến: chọn nó để chuyển ô bên cạnh sang tìm theo thời gian
const TYPE_OPTIONS = [
  { value: '', label: 'Tất cả cảm biến' },
  { value: 'temperature', label: 'Nhiệt độ' },
  { value: 'humidity', label: 'Độ ẩm' },
  { value: 'light', label: 'Ánh sáng' },
  { value: 'time', label: 'Thời gian' }
]

// Đổi bộ lọc trên giao diện sang tham số API /sensor-data
function fetchSensorPage({ type, search, ...rest }) {
  const byTime = type === 'time'
  return getSensorHistory({
    ...rest,
    search,
    type: byTime ? '' : type,
    searchField: byTime ? 'time' : (search ? 'value' : 'all')
  })
}

export default function SensorsPage() {
  const { data, loading, applyFilters, setPage, setSize } = usePagedData(fetchSensorPage, { type: '', search: '', sort: 'recordedAt,desc' })
  const [type, setType] = useState('')
  const [search, setSearch] = useState('')
  const byTime = type === 'time'

  function handleSearch() {
    applyFilters({ type, search: search.trim() })
  }

  function handleReset() {
    setType('')
    setSearch('')
    applyFilters({ type: '', search: '' })
  }

  return (
    <div className="page">
      <PageHeader title="Cảm biến" subtitle="Tra cứu lịch sử giá trị cảm biến theo loại, giá trị hoặc thời gian" />

      <FilterToolbar onSearch={handleSearch} onReset={handleReset}>
        <FilterField label={byTime ? 'TÌM THEO' : 'LOẠI CẢM BIẾN'}>
          <FilterSelect value={type} onChange={setType} options={TYPE_OPTIONS} />
        </FilterField>
        <FilterField label={byTime ? 'THỜI GIAN' : 'GIÁ TRỊ'}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={byTime ? 'Nhập thời gian (VD: 07/10/2026 hoặc 10:30)...' : 'Nhập giá trị cần tìm...'}
          />
        </FilterField>
      </FilterToolbar>

      <DataTable
        headers={['ID', 'Tên cảm biến', 'Giá trị đo', 'Thời gian']}
        rows={data.content}
        loading={loading}
        emptyText="Không có bản ghi phù hợp."
        rowKey={(row) => `${row.dataId}-${row.sensorType}`}
        renderRow={(row) => (
          <>
            <td className="technical-id">{row.dataId}</td>
            <td>{SENSOR_NAMES[row.sensorType] ?? row.sensorName}</td>
            <td>{row.value} {row.unit}</td>
            <td>{formatTime(row.recordedAt)}</td>
          </>
        )}
        footer={<TablePagination data={data} onPageChange={setPage} onSizeChange={setSize} />}
      />
    </div>
  )
}
