import { Router } from 'express'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { parsePagination, buildPageResponse } from '../utils/pagination.js'
import { whereClause } from '../utils/sql.js'
import { timeSearchCondition } from '../utils/time.js'

const router = Router()

const HISTORY_FROM = `
  FROM action_history ah
  JOIN devices d ON d.device_id = ah.device_id
  JOIN users u ON u.user_id = ah.user_id`

const HISTORY_COLUMNS = `
  SELECT ah.history_id, ah.action_code, d.device_id, d.device_name, ah.action, ah.action_time,
         ah.result, u.full_name AS user_name, ah.area, ah.confirmed_at`

function toHistoryDto(row) {
  return {
    historyId: row.history_id,
    actionCode: row.action_code,
    deviceId: row.device_id,
    deviceName: row.device_name,
    action: row.action,
    actionTime: row.action_time.toISOString(),
    confirmedAt: row.confirmed_at ? row.confirmed_at.toISOString() : null,
    result: row.result,
    userName: row.user_name,
    area: row.area
  }
}

// Điều kiện ô tìm kiếm. searchField: all | id | device | time
function searchCondition(search, searchField) {
  const conditions = []
  const params = []

  if ((searchField === 'all' || searchField === 'id') && /^\d+$/.test(search)) {
    conditions.push('ah.history_id = ?')
    params.push(Number(search))
  }
  if (searchField === 'all' || searchField === 'device') {
    conditions.push('d.device_name LIKE ?')
    params.push(`%${search}%`)
  }
  if (searchField === 'all' || searchField === 'time') {
    const time = timeSearchCondition('ah.action_time', search, { matchRaw: true })
    conditions.push(time.sql)
    params.push(...time.params)
  }

  // Không có điều kiện nào áp dụng được (VD: tìm theo ID mà nhập chữ) -> không khớp dòng nào
  return { sql: conditions.length ? `(${conditions.join(' OR ')})` : '1 = 0', params }
}

// Danh sách lịch sử điều khiển.
// Query: search, searchField, deviceId, action, result, from, to, page, size
router.get('/action-history', requireAuth, async (req, res) => {
  const { page, size, offset } = parsePagination(req.query)
  const { deviceId, action, result, from, to, searchField = 'all' } = req.query
  const search = String(req.query.search || '').trim()

  const conditions = []
  const params = []
  const addFilter = (sql, value) => {
    conditions.push(sql)
    params.push(value)
  }

  if (search) {
    const s = searchCondition(search, searchField)
    conditions.push(s.sql)
    params.push(...s.params)
  }
  if (deviceId) addFilter('ah.device_id = ?', deviceId)
  if (action) addFilter('ah.action = ?', action)
  if (result) addFilter('ah.result = ?', result)
  if (from) addFilter('ah.action_time >= ?', new Date(from))
  if (to) addFilter('ah.action_time <= ?', new Date(to))
  const where = whereClause(conditions)

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM action_history ah JOIN devices d ON d.device_id = ah.device_id ${where}`,
    params
  )
  const [rows] = await pool.query(
    `${HISTORY_COLUMNS} ${HISTORY_FROM}
     ${where}
     ORDER BY ah.action_time DESC, ah.history_id DESC
     LIMIT ? OFFSET ?`,
    [...params, size, offset]
  )

  res.json(buildPageResponse({ content: rows.map(toHistoryDto), page, size, totalElements: total }))
})

router.get('/action-history/:historyId', requireAuth, async (req, res) => {
  const [[row]] = await pool.query(`${HISTORY_COLUMNS} ${HISTORY_FROM} WHERE ah.history_id = ?`, [req.params.historyId])
  if (!row) return res.status(404).json({ message: 'Không tìm thấy bản ghi' })
  res.json(toHistoryDto(row))
})

export default router
