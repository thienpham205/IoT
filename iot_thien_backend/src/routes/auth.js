import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { asyncRoute } from '../utils/asyncRoute.js'

const router = Router()

router.post('/login', asyncRoute(async (req, res) => {
  const { username, password } = req.body || {}
  if (!username || !password) {
    return res.status(400).json({ message: 'Thiếu username hoặc password' })
  }

  const [[user]] = await pool.query(
    'SELECT user_id, username, password_hash, full_name, role FROM users WHERE username = ?',
    [String(username).trim()]
  )

  const genericError = { message: 'Tên đăng nhập hoặc mật khẩu không đúng' }
  if (!user) return res.status(401).json(genericError)

  const ok = await bcrypt.compare(password, user.password_hash)
  if (!ok) return res.status(401).json(genericError)

  const expiresIn = Number(process.env.JWT_EXPIRES_IN || 3600)
  const accessToken = jwt.sign({ userId: user.user_id, role: user.role }, process.env.JWT_SECRET, { expiresIn })

  res.json({
    accessToken,
    expiresIn,
    user: { userId: user.user_id, fullName: user.full_name, role: user.role }
  })
}))

router.get('/me', requireAuth, asyncRoute(async (req, res) => {
  const [[user]] = await pool.query(
    `SELECT user_id, username, full_name, student_id, email, role,
            github_link, figma_link, postman_link, pdf_link
     FROM users WHERE user_id = ?`,
    [req.user.userId]
  )
  if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' })

  res.json({
    user: {
      userId: user.user_id,
      username: user.username,
      fullName: user.full_name,
      studentId: user.student_id,
      email: user.email,
      role: user.role,
      githubLink: user.github_link,
      figmaLink: user.figma_link,
      postmanLink: user.postman_link,
      pdfLink: user.pdf_link
    }
  })
}))

export default router
