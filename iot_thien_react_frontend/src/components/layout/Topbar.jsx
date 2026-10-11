import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUser } from '../../services/auth'
import { formatClock, initialOf } from '../../utils/format'

export default function Topbar() {
  const navigate = useNavigate()
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="topbar">
      <span className="topbar-brand">IoT_ThienPM</span>
      <div className="topbar-actions">
        <button className="top-pill" onClick={() => navigate('/profile')}>
          <span className="mini-avatar">{initialOf(getUser()?.fullName)}</span>
          Hồ sơ
        </button>
        <div className="top-pill">{formatClock(now)}</div>
      </div>
    </header>
  )
}
