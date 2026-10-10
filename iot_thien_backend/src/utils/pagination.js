export function parsePagination(query) {
  const page = Math.max(0, Number.parseInt(query.page, 10) || 0)
  const size = Math.min(100, Math.max(1, Number.parseInt(query.size, 10) || 10))
  return { page, size, offset: page * size }
}

export function buildPageResponse({ content, page, size, totalElements }) {
  return {
    content,
    page,
    size,
    totalElements,
    totalPages: Math.max(1, Math.ceil(totalElements / size))
  }
}

// Không ghép trực tiếp tên cột do client gửi vào SQL - chỉ nhận giá trị nằm
// trong whitelist (đúng quy tắc 2.6.7 của báo cáo).
export function resolveSort(sortParam, whitelist, fallback) {
  const [field, dir] = String(sortParam || fallback).split(',')
  const safeField = whitelist.includes(field) ? field : fallback.split(',')[0]
  const safeDir = dir === 'asc' ? 'ASC' : 'DESC'
  return { field: safeField, dir: safeDir }
}
