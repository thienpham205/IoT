// Ghép danh sách điều kiện thành mệnh đề WHERE (rỗng nếu không có điều kiện nào)
export function whereClause(conditions) {
  return conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
}
