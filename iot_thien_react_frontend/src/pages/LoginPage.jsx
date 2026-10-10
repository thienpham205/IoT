import { Eye, EyeOff, LockKeyhole, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { isAuthenticated, setAuth } from '../services/auth'
import { login } from '../services/iotService'

export default function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('phamminhthien')
  const [password, setPassword] = useState('123456')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated()) return <Navigate to="/" replace />

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(username, password)
      setAuth(data.accessToken, data.user)
      navigate('/')
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Đăng nhập thất bại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-visual">
        <div className="visual-orb orb-1" />
        <div className="visual-orb orb-2" />
        <div className="login-brand">IoT_ThienPM</div>
        <div className="login-message">
          <span className="eyebrow">ESP8266 · MQTT · Web</span>
          <h1>Giám sát môi trường.<br/>Điều khiển thiết bị.</h1>
          <p>Theo dõi nhiệt độ, độ ẩm, ánh sáng và điều khiển thiết bị từ một giao diện thống nhất.</p>
        </div>
      </div>

      <div className="login-panel">
        <form className="login-card" onSubmit={submit}>
          <div className="login-logo">IoT_ThienPM</div>
          <h2>Đăng nhập</h2>
          <p>Nhập tài khoản để truy cập Dashboard.</p>

          <label>Tên đăng nhập</label>
          <div className="input-with-icon">
            <UserRound size={18} />
            <input value={username} onChange={(e)=>setUsername(e.target.value)} placeholder="phamminhthien" autoComplete="username" />
          </div>

          <label>Mật khẩu</label>
          <div className="input-with-icon">
            <LockKeyhole size={18} />
            <input type={show ? 'text' : 'password'} value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
            <button type="button" className="icon-button" onClick={()=>setShow(v=>!v)}>{show ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
          </div>

          {error ? <div className="form-error">{error}</div> : null}

          <button className="login-button" disabled={loading}>{loading ? 'Đang xác thực...' : 'Đăng nhập'}</button>
          <div className="demo-hint">Tài khoản demo: <b>phamminhthien</b> / <b>123456</b></div>
        </form>
      </div>
    </div>
  )
}
