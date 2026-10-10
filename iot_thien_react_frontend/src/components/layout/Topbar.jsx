import { Clock3, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Topbar() {
  const navigate = useNavigate()
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 30000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="topbar">
      <span className="topbar-brand">IoT_ThienPM</span>
      <div className="topbar-actions">
        <button className="top-pill" onClick={() => navigate('/profile')}>
          <span className="mini-avatar">T</span>
          Hồ sơ
        </button>
        <div className="top-pill">
          <Clock3 size={18} color="#6847ff" />
          {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </header>
  )
}
