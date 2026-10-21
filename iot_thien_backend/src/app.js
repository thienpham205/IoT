import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import sensorRoutes from './routes/sensors.js'
import deviceRoutes from './routes/devices.js'
import historyRoutes from './routes/history.js'

export const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

app.use('/api/auth', authRoutes)
app.use('/api', sensorRoutes)
app.use('/api', deviceRoutes)
app.use('/api', historyRoutes)

app.use((req, res) => res.status(404).json({ message: 'Not found' }))

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Body JSON sai cú pháp (express.json báo lỗi entity.parse.failed): lỗi của client, trả 400
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Dữ liệu JSON không hợp lệ' })
  }
  console.error('[error]', err)
  res.status(500).json({ message: 'Lỗi hệ thống' })
})
