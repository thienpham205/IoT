import { useEffect, useState } from 'react'

const EMPTY_PAGE = { content: [], page: 0, size: 10, totalElements: 0, totalPages: 1 }

// Quản lý dữ liệu bảng có phân trang: giữ bộ lọc + trang hiện tại, tự tải lại khi chúng đổi.
// fetchPage(params) trả về { content, page, size, totalElements, totalPages }.
export function usePagedData(fetchPage, initialFilters) {
  const [params, setParams] = useState({ page: 0, size: 10, ...initialFilters })
  const [data, setData] = useState(EMPTY_PAGE)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        setData(await fetchPage(params))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params])

  return {
    data,
    loading,
    // Áp bộ lọc mới và quay về trang đầu
    applyFilters: (filters) => setParams((p) => ({ ...p, ...filters, page: 0 })),
    setPage: (page) => setParams((p) => ({ ...p, page })),
    setSize: (size) => setParams((p) => ({ ...p, size, page: 0 }))
  }
}
