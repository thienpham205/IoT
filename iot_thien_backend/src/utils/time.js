// Biểu thức SQL đổi cột thời gian sang giờ Việt Nam (UTC+7).
// Chỉ truyền vào tên cột cố định trong code, không truyền giá trị từ client.
function vnTime(column) {
  return `CONVERT_TZ(${column}, @@session.time_zone, '+07:00')`
}

// Điều kiện tìm CHÍNH XÁC theo thời gian (giờ 24h, giờ Việt Nam), dùng chung cho
// trang Cảm biến và Lịch sử hoạt động:
//   "17:30" / "17:30:15"                    -> đúng giờ:phút[:giây]
//   "17h"                                    -> cả khung giờ 17
//   "2026-10-07" (hoặc "07/10/2026")         -> cả ngày đó
//   "2026-10-07 17:30[:15]"                  -> đúng ngày + giờ
// Dạng khác (VD "1", "abc") -> không khớp dòng nào.
// Trả về { sql, params } để ghép vào mệnh đề WHERE.
export function timeSearchCondition(column, search) {
  const time = vnTime(column)
  const clock = (h, m, s) => ({
    sql: [`HOUR(${time}) = ?`, `MINUTE(${time}) = ?`, ...(s === undefined ? [] : [`SECOND(${time}) = ?`])],
    params: [Number(h), Number(m), ...(s === undefined ? [] : [Number(s)])]
  })
  const join = (parts) => ({ sql: `(${parts.sql.join(' AND ')})`, params: parts.params })

  // Ngày dạng yyyy-MM-dd (định dạng hiển thị trên giao diện) hoặc dd/MM/yyyy
  const dateDMY = search.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/)
  const dateYMD = search.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/)

  if (dateDMY || dateYMD) {
    let year, month, day, h, m, s
    if (dateDMY) {
      [, day, month, year, h, m, s] = dateDMY
    } else {
      [, year, month, day, h, m, s] = dateYMD
    }
    const sql = [`DATE(${time}) = ?`]
    const params = [`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`]
    if (h !== undefined) {
      const c = clock(h, m, s)
      sql.push(...c.sql)
      params.push(...c.params)
    }
    return join({ sql, params })
  }

  const hm = search.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/)
  if (hm) return join(clock(hm[1], hm[2], hm[3]))

  const hourOnly = search.match(/^(\d{1,2})h$/i)
  if (hourOnly) return { sql: `(HOUR(${time}) = ?)`, params: [Number(hourOnly[1])] }

  return { sql: '(1 = 0)', params: [] }
}
