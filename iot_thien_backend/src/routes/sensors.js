import { Router } from 'express'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { parsePagination, buildPageResponse, resolveSort } from '../utils/pagination.js'
import { whereClause } from '../utils/sql.js'
import { timeSearchCondition } from '../utils/time.js'

const router = Router()

// Mỗi bản ghi sensor_data chứa 3 giá trị đo; trang Cảm biến hiển thị mỗi giá trị thành
// 1 dòng riêng nên tách ngay trong SQL để lọc / phân trang đúng theo số dòng hiển thị.
// Khóa của object là whitelist, chỉ khóa này mới được ghép vào câu SQL.
const SENSOR_TYPES = {
  temperature: { name: 'Cảm biến nhiệt độ', column: 'sd.temperature', unit: '°C' },
  humidity: { name: 'Cảm biến độ ẩm', column: 'sd.humidity', unit: '%' },
  light: { name: 'Cảm biến ánh sáng', column: 'sd.light', unit: 'lux' }
}

const SORT_WHITELIST = ['recordedAt', 'value', 'dataId']
const SORT_COLUMN = { recordedAt: 'x.recorded_at', value: 'x.value', dataId: 'x.data_id' }

// Độ rộng mỗi nhóm khi gom trung bình cho biểu đồ
const BUCKET_SECONDS = { '1m': 60, '5m': 300, '1h': 3600, '1d': 86400 }
const MAX_REALTIME_POINTS = 200

const SENSOR_DATA_FROM = 'FROM sensor_data sd JOIN sensors s ON s.sensor_id = sd.sensor_id'

// Bản ghi đo đầy đủ (1 lần đo = nhiệt độ + độ ẩm + ánh sáng)
function toMeasurementDto(row) {
  return {
    sensorCode: row.sensor_code,
    sensorName: row.sensor_name,
    temperature: Number(row.temperature),
    humidity: Number(row.humidity),
    light: row.light,
    status: row.status,
    recordedAt: row.recorded_at.toISOString()
  }
}

// 3 dãy số của biểu đồ, cùng thứ tự với labels
function toChartSeries(rows) {
  return {
    temperature: rows.map((r) => Number(r.temperature)),
    humidity: rows.map((r) => Number(r.humidity)),
    light: rows.map((r) => Number(r.light))
  }
}

router.get('/sensors', requireAuth, async (req, res) => {
  const [sensors] = await pool.query(
    "SELECT sensor_id, sensor_code, sensor_name, sensor_type, unit, location, status FROM sensors WHERE status = 'ACTIVE' ORDER BY sensor_id"
  )
  res.json({
    sensors: sensors.map((s) => ({
      sensorId: s.sensor_id,
      sensorCode: s.sensor_code,
      sensorName: s.sensor_name,
      sensorType: s.sensor_type,
      unit: s.unit,
      location: s.location,
      status: s.status
    }))
  })
})

// Lần đo mới nhất (thẻ Nhiệt độ / Độ ẩm / Độ sáng trên Dashboard)
router.get('/sensor-data/latest', requireAuth, async (req, res) => {
  const { sensorCode } = req.query
  const [[row]] = await pool.query(
    `SELECT sd.data_id, s.sensor_code, s.sensor_name, sd.temperature, sd.humidity, sd.light, sd.status, sd.recorded_at
     ${SENSOR_DATA_FROM}
     ${sensorCode ? 'WHERE s.sensor_code = ?' : ''}
     ORDER BY sd.recorded_at DESC LIMIT 1`,
    sensorCode ? [sensorCode] : []
  )
  if (!row) return res.status(404).json({ data: null, message: 'Chưa có dữ liệu' })

  const dataAgeSeconds = Math.max(0, Math.round((Date.now() - new Date(row.recorded_at).getTime()) / 1000))
  res.json({ ...toMeasurementDto(row), stale: dataAgeSeconds > 30, dataAgeSeconds })
})

// Biểu đồ Dashboard.
// - points > 0: chế độ thời gian thực, trả về N lần đo gần nhất (không gom nhóm)
// - còn lại: gom trung bình theo interval (1m | 5m | 1h | 1d) trong khoảng from..to
router.get('/sensor-data/chart', requireAuth, async (req, res) => {
  const points = Number.parseInt(req.query.points, 10)
  if (points > 0) return res.json(await realtimeChart(points, req.query.sensorCode))

  const { from, to } = req.query
  if (from && to && new Date(from) >= new Date(to)) {
    return res.status(400).json({ message: 'from phải nhỏ hơn to' })
  }
  res.json(await bucketChart(req.query))
})

async function realtimeChart(points, sensorCode) {
  const limit = Math.min(points, MAX_REALTIME_POINTS)
  const [rows] = await pool.query(
    `SELECT * FROM (
       SELECT sd.temperature, sd.humidity, sd.light, sd.recorded_at
       ${SENSOR_DATA_FROM}
       ${sensorCode ? 'WHERE s.sensor_code = ?' : ''}
       ORDER BY sd.recorded_at DESC
       LIMIT ?
     ) latest ORDER BY recorded_at ASC`,
    sensorCode ? [sensorCode, limit] : [limit]
  )
  return {
    labels: rows.map((r) => r.recorded_at.toLocaleTimeString('vi-VN', { hour12: false, timeZone: 'Asia/Ho_Chi_Minh' })),
    series: toChartSeries(rows),
    interval: 'raw',
    timezone: 'Asia/Ho_Chi_Minh'
  }
}

async function bucketChart({ sensorCode, from, to, interval: requested }) {
  const interval = BUCKET_SECONDS[requested] ? requested : '1h'
  const bucketSeconds = BUCKET_SECONDS[interval]

  const conditions = []
  // 2 dấu ? của bucket nằm ở SELECT, đứng trước các dấu ? của WHERE
  const params = [bucketSeconds, bucketSeconds]
  if (sensorCode) {
    conditions.push('s.sensor_code = ?')
    params.push(sensorCode)
  }
  if (from) {
    conditions.push('sd.recorded_at >= ?')
    params.push(new Date(from))
  }
  if (to) {
    conditions.push('sd.recorded_at <= ?')
    params.push(new Date(to))
  }

  const [rows] = await pool.query(
    `SELECT
       FLOOR(UNIX_TIMESTAMP(sd.recorded_at) / ?) * ? AS bucket,
       ROUND(AVG(sd.temperature), 2) AS temperature,
       ROUND(AVG(sd.humidity), 2) AS humidity,
       ROUND(AVG(sd.light), 0) AS light
     ${SENSOR_DATA_FROM}
     ${whereClause(conditions)}
     GROUP BY bucket
     ORDER BY bucket ASC
     LIMIT 500`,
    params
  )

  const labelFormat = { hour: '2-digit', minute: '2-digit', ...(interval === '1d' ? { day: '2-digit', month: '2-digit' } : {}) }
  return {
    labels: rows.map((r) => new Date(r.bucket * 1000).toLocaleString('vi-VN', labelFormat)),
    series: toChartSeries(rows),
    interval,
    timezone: 'Asia/Bangkok'
  }
}

// Điều kiện ô tìm kiếm trên bảng đã tách dòng (alias x). searchField: all | id | value | time
function searchCondition(search, searchField) {
  const conditions = []
  const params = []
  const any = searchField === 'all'

  if ((any || searchField === 'id') && /^\d+$/.test(search)) {
    conditions.push('x.data_id = ?')
    params.push(Number(search))
  }
  if (any || searchField === 'value') {
    // Giá trị đo BẰNG ĐÚNG số đã nhập ("350" khớp 350; "35" không khớp; "28.50" khớp 28.5).
    // Nhập chữ (không phải số) thì không có điều kiện nào -> không khớp dòng nào.
    const num = Number(search)
    if (!Number.isNaN(num)) {
      conditions.push('x.value = ?')
      params.push(num)
    }
  }
  if (any || searchField === 'time') {
    const time = timeSearchCondition('x.recorded_at', search)
    conditions.push(time.sql)
    params.push(...time.params)
  }

  // Không có điều kiện nào áp dụng được (VD: tìm theo ID mà nhập chữ) -> không khớp dòng nào
  return { sql: conditions.length ? `(${conditions.join(' OR ')})` : '1 = 0', params }
}

// Danh sách giá trị đo, mỗi dòng = 1 loại cảm biến của 1 lần đo.
// Query: type (temperature|humidity|light, rỗng = tất cả), searchField (all|id|value|time),
//        search, from, to, sort (recordedAt|value|dataId,asc|desc), page, size
router.get('/sensor-data', requireAuth, async (req, res) => {
  const { page, size, offset } = parsePagination(req.query)
  const { field, dir } = resolveSort(req.query.sort, SORT_WHITELIST, 'recordedAt,desc')
  const { type, searchField = 'all', from, to } = req.query
  const search = String(req.query.search || '').trim()

  // Điều kiện thời gian đặt trong từng nhánh UNION để vẫn dùng được index recorded_at
  const timeConditions = []
  const timeParams = []
  if (from) {
    timeConditions.push('sd.recorded_at >= ?')
    timeParams.push(new Date(from))
  }
  if (to) {
    timeConditions.push('sd.recorded_at <= ?')
    timeParams.push(new Date(to))
  }

  // Bảng tạm x: mỗi loại cảm biến là một nhánh UNION ALL
  const types = SENSOR_TYPES[type] ? [type] : Object.keys(SENSOR_TYPES)
  const unionSql = types
    .map((t) => `SELECT sd.data_id, '${t}' AS sensor_type, ${SENSOR_TYPES[t].column} AS value, sd.recorded_at
                 FROM sensor_data sd ${whereClause(timeConditions)}`)
    .join(' UNION ALL ')
  const unionParams = types.flatMap(() => timeParams)

  const s = search ? searchCondition(search, searchField) : null
  const where = s ? `WHERE ${s.sql}` : ''
  const params = [...unionParams, ...(s ? s.params : [])]

  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM (${unionSql}) x ${where}`, params)
  const [rows] = await pool.query(
    `SELECT x.data_id, x.sensor_type, x.value, x.recorded_at
     FROM (${unionSql}) x
     ${where}
     ORDER BY ${SORT_COLUMN[field]} ${dir}, x.data_id ${dir}, FIELD(x.sensor_type, 'temperature', 'humidity', 'light')
     LIMIT ? OFFSET ?`,
    [...params, size, offset]
  )

  const content = rows.map((r) => ({
    dataId: r.data_id,
    sensorType: r.sensor_type,
    sensorName: SENSOR_TYPES[r.sensor_type].name,
    value: Number(r.value),
    unit: SENSOR_TYPES[r.sensor_type].unit,
    recordedAt: r.recorded_at.toISOString()
  }))
  res.json(buildPageResponse({ content, page, size, totalElements: total }))
})

router.get('/sensor-data/:dataId', requireAuth, async (req, res) => {
  const [[row]] = await pool.query(
    `SELECT sd.data_id, s.sensor_name, s.sensor_code, sd.temperature, sd.humidity, sd.light, sd.status, sd.recorded_at
     ${SENSOR_DATA_FROM}
     WHERE sd.data_id = ?`,
    [req.params.dataId]
  )
  if (!row) return res.status(404).json({ message: 'Không tìm thấy bản ghi' })
  res.json({ dataId: row.data_id, ...toMeasurementDto(row) })
})

export default router
