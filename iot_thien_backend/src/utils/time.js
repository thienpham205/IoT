// Biểu thức SQL đổi cột thời gian sang chuỗi giờ Việt Nam, cùng định dạng dd/MM/yyyy HH:mm:ss
// mà giao diện hiển thị, để người dùng gõ đúng những gì nhìn thấy trên bảng là tìm được.
// Chỉ truyền vào tên cột cố định trong code, không truyền giá trị từ client.
export function vnTimeText(column) {
  return `DATE_FORMAT(CONVERT_TZ(${column}, @@session.time_zone, '+07:00'), '%d/%m/%Y %H:%i:%s')`
}

// Điều kiện tìm theo thời gian trên một cột (dùng chung cho Cảm biến và Lịch sử hoạt động):
// - so khớp chuỗi con trên định dạng dd/MM/yyyy HH:mm:ss
// - nếu gõ dạng giờ "H:mm[:ss]" thì khớp cả giờ có số 0 đứng đầu ("5:30" -> " 05:30")
//   và giờ chiều tương ứng ("5:30" -> " 17:30")
// - matchRaw: thêm so khớp trên chuỗi thời gian gốc của MySQL (yyyy-MM-dd HH:mm:ss)
// Trả về { sql, params } để ghép vào mệnh đề WHERE.
export function timeSearchCondition(column, search, { matchRaw = false } = {}) {
  const text = vnTimeText(column)
  const conditions = [`${text} LIKE ?`]
  const params = [`%${search}%`]

  if (matchRaw) {
    conditions.push(`CAST(${column} AS CHAR) LIKE ?`)
    params.push(`%${search}%`)
  }

  const clock = search.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
  if (clock) {
    const hour = Number.parseInt(clock[1], 10)
    const rest = clock[2] + (clock[3] ? `:${clock[3]}` : '')
    conditions.push(`${text} LIKE ?`)
    params.push(`% ${String(hour).padStart(2, '0')}:${rest}%`)
    if (hour <= 12) {
      conditions.push(`${text} LIKE ?`)
      params.push(`% ${String(hour + 12).padStart(2, '0')}:${rest}%`)
    }
  }

  return { sql: `(${conditions.join(' OR ')})`, params }
}
