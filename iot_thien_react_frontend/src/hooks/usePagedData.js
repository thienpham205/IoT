import { useEffect, useState } from 'react'

const EMPTY_PAGE = { content: [], page: 0, size: 10, totalElements: 0, totalPages: 1 }

// Quản lý dữ liệu bảng có phân trang: giữ bộ lọc + trang hiện tại, tự tải lại khi chúng đổi.
// fetchPage(params) trả về { content, page, size, totalElements, totalPages }.
// fetchPage nên là hàm khai báo ngoài component để không bị tạo lại mỗi lần render.
export function usePagedData(fetchPage, initialFilters) {
  const [params, setParams] = useState({ page: 0, size: 10, ...initialFilters })
  const [data, setData] = useState(EMPTY_PAGE)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        setData(await fetchPage(params))
        setError('')
      } catch (err) {
        setError(err?.response?.data?.message || err.message || 'Không tải được dữ liệu.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [fetchPage, params])

  return {
    data,
    loading,
    error,
    // Áp bộ lọc mới và quay về trang đầu
    applyFilters: (filters) => setParams((p) => ({ ...p, ...filters, page: 0 })),
    setPage: (page) => setParams((p) => ({ ...p, page })),
    setSize: (size) => setParams((p) => ({ ...p, size, page: 0 }))
  }
}
