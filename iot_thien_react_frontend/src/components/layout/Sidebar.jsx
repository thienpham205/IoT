import { NavLink } from 'react-router-dom'

const items = [
  { to: '/', label: 'Trang chủ' },
  { to: '/sensors', label: 'Cảm biến' },
  { to: '/history', label: 'Lịch sử hoạt động' },
  { to: '/profile', label: 'Hồ sơ' }
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">IoT_ThienPM</div>
      <nav className="sidebar-nav">
        {items.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
