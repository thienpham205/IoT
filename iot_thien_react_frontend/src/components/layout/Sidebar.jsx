import { Activity, Clock3, Gauge, UserRound } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const items = [
  { to: '/', label: 'Trang chủ', icon: Gauge },
  { to: '/sensors', label: 'Cảm biến', icon: Activity },
  { to: '/history', label: 'Lịch sử hoạt động', icon: Clock3 },
  { to: '/profile', label: 'Hồ sơ', icon: UserRound }
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">IoT_ThienPM</div>
      <nav className="sidebar-nav">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={21} strokeWidth={2} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
