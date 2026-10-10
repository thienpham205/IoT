// Biểu thức SQL đổi cột thời gian sang giờ Việt Nam (UTC+7).
// Chỉ truyền vào tên cột cố định trong code, không truyền giá trị từ client.
function vnTime(column) {
  return `CONVERT_TZ(${column}, @@session.time_zone, '+07:00')`
}

// Chuỗi giờ Việt Nam cùng định dạng dd/MM/yyyy HH:mm:ss mà giao diện hiển thị,
// để người dùng gõ đúng những gì nhìn thấy trên bảng là tìm được.
export function vnTimeText(column) {
  return `DATE_FORMAT(${vnTime(column)}, '%d/%m/%Y %H:%i:%s')`
}

// Điều kiện tìm theo thời gian trên một cột (dùng chung cho Cảm biến và Lịch sử hoạt động),
// cùng quy tắc với bộ lọc mock ở frontend (matchTimeQuery):
// - "H:mm" / "H:mm:ss" (VD "5:30", "17:30:15"): khớp chính xác giờ 24h -> "5:30" chỉ ra 05:30,
//   không ra 15:30 hay 17:30
// - "Hh" / "H:" (VD "17h"): mọi bản ghi trong giờ đó
// - còn lại (ngày, ngày + giờ...): so khớp chuỗi con trên định dạng dd/MM/yyyy HH:mm:ss
// - matchRaw: thêm so khớp chuỗi con trên dạng gốc của MySQL (yyyy-MM-dd HH:mm:ss)
// Trả về { sql, params } để ghép vào mệnh đề WHERE.
export function timeSearchCondition(column, search, { matchRaw = false } = {}) {
  const time = vnTime(column)

  const clock = search.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/)
  if (clock) {
    const [, hour, minute, second] = clock.map(Number)
    if (clock[3] === undefined) {
      return { sql: `(HOUR(${time}) = ? AND MINUTE(${time}) = ?)`, params: [hour, minute] }
    }
    return {
      sql: `(HOUR(${time}) = ? AND MINUTE(${time}) = ? AND SECOND(${time}) = ?)`,
      params: [hour, minute, second]
    }
  }

  const hourOnly = search.match(/^(\d{1,2})(?:h|:)$/i)
  if (hourOnly) return { sql: `(HOUR(${time}) = ?)`, params: [Number(hourOnly[1])] }

  const conditions = [`${vnTimeText(column)} LIKE ?`]
  const params = [`%${search}%`]
  if (matchRaw) {
    conditions.push(`CAST(${column} AS CHAR) LIKE ?`)
    params.push(`%${search}%`)
  }
  return { sql: `(${conditions.join(' OR ')})`, params }
}
