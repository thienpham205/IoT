import { LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import DataTable from '../components/common/DataTable'
import FilterToolbar, { FilterField, FilterSelect } from '../components/common/FilterToolbar'
import ResultBadge from '../components/common/ResultBadge'
import TablePagination from '../components/common/TablePagination'
import PageHeader from '../components/layout/PageHeader'
import { usePagedData } from '../hooks/usePagedData'
import { getActionHistory, getDevices } from '../services/iotService'
import { formatTime } from '../utils/format'

const ACTION_OPTIONS = [
  { value: '', label: 'Tất cả hành động' },
  { value: 'ON', label: 'BẬT (ON)' },
  { value: 'OFF', label: 'TẮT (OFF)' }
]

const RESULT_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'SUCCESS', label: 'Thành công (SUCCESS)' },
  { value: 'FAILED', label: 'Thất bại (FAILED)' },
  { value: 'PENDING', label: 'Đang chờ (PENDING)' }
]

const EMPTY_FILTERS = { deviceId: '', action: '', result: '', search: '' }

// Ô tìm kiếm của trang này luôn tìm theo thời gian
const fetchHistoryPage = (params) => getActionHistory({ ...params, searchField: 'time' })

// Cột "Trạng thái": đang chờ ACK / thất bại / trạng thái ON-OFF đã xác nhận
function ActionStatus({ result, action }) {
  if (result === 'PENDING') {
    return (
      <span className="status-badge warn">
        <LoaderCircle size={11} className="spin" />
        Đang chờ ACK
      </span>
    )
  }
  if (result === 'FAILED')
    return (
      <span className="status-badge bad">
        <i />
        Thất bại
      </span>
    )
  return (
    <span className={`status-badge ${action === 'ON' ? 'good' : 'neutral'}`}>
      <i />
      {action}
    </span>
  )
}

export default function ActionHistoryPage() {
  const { data, loading, error, applyFilters, setPage, setSize } = usePagedData(fetchHistoryPage, EMPTY_FILTERS)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [devices, setDevices] = useState([])

  // Danh sách thiết bị cho ô lọc; lỗi thì ô lọc chỉ còn "Tất cả thiết bị" (lỗi đã hiện ở bảng)
  useEffect(() => {
    getDevices()
      .then(setDevices)
      .catch(() => setDevices([]))
  }, [])

  const setFilter = (key) => (value) => setFilters((f) => ({ ...f, [key]: value }))
  const deviceOptions = [
    { value: '', label: 'Tất cả thiết bị' },
    ...devices.map((d) => ({ value: d.deviceId, label: d.deviceName }))
  ]

  function handleSearch() {
    applyFilters({ ...filters, search: filters.search.trim() })
  }

  function handleReset() {
    setFilters(EMPTY_FILTERS)
    applyFilters(EMPTY_FILTERS)
  }

  return (
    <div className="page">
      <PageHeader
        title="Lịch sử hoạt động"
        subtitle="Kiểm tra thiết bị, hành động, thời gian, kết quả và người thao tác"
      />

      <FilterToolbar onSearch={handleSearch} onReset={handleReset}>
        <FilterField label="THIẾT BỊ">
          <FilterSelect value={filters.deviceId} onChange={setFilter('deviceId')} options={deviceOptions} />
        </FilterField>
        <FilterField label="HÀNH ĐỘNG">
          <FilterSelect value={filters.action} onChange={setFilter('action')} options={ACTION_OPTIONS} />
        </FilterField>
        <FilterField label="TRẠNG THÁI">
          <FilterSelect value={filters.result} onChange={setFilter('result')} options={RESULT_OPTIONS} />
        </FilterField>
        <FilterField label="THỜI GIAN">
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilter('search')(e.target.value)}
            placeholder="Nhập giờ hoặc ngày (VD: 5:30, 17:30, 07/10/2026)..."
          />
        </FilterField>
      </FilterToolbar>

      {error ? <div className="page-error">{error}</div> : null}

      <DataTable
        headers={['ID', 'Tên thiết bị', 'Hành động', 'Trạng thái', 'Kết quả', 'Người thao tác', 'Thời gian']}
        rows={data.content}
        loading={loading}
        emptyText="Không có dữ liệu phù hợp."
        rowKey={(row) => row.historyId}
        renderRow={(row) => (
          <>
            <td className="technical-id">{row.historyId}</td>
            <td>
              <strong>{row.deviceName}</strong>
            </td>
            <td>{row.action}</td>
            <td>
              <ActionStatus result={row.result} action={row.action} />
            </td>
            <td>
              <ResultBadge result={row.result} />
            </td>
            <td>{row.userName}</td>
            <td>{formatTime(row.actionTime)}</td>
          </>
        )}
        footer={<TablePagination data={data} onPageChange={setPage} onSizeChange={setSize} />}
      />
    </div>
  )
}
