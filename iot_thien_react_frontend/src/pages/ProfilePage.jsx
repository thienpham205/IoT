import { ExternalLink, FileText, Github, LogOut, Mail, Palette, Send, ShieldCheck, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/layout/PageHeader'
import { clearAuth, getUser } from '../services/auth'
import { getMe } from '../services/iotService'
import { initialOf } from '../utils/format'

// File tĩnh trong public/files, dùng khi CSDL chưa có link
const POSTMAN_FILE = '/files/IOT_Thien_API.postman_collection.json'
const PDF_FILE = '/files/Pham_Minh_Thien_B23DCAT285_IOT_Report.pdf'

// Giá trị hiển thị khi chưa tải được thông tin người dùng
const DEFAULT_USER = {
  username: 'phamminhthien',
  fullName: 'Phạm Minh Thiện',
  studentId: 'B23DCAT285',
  email: 'phamminhthien@ptit.edu.vn',
  role: 'USER'
}

const INFO_ROWS = [
  { key: 'username', label: 'Username', icon: UserRound },
  { key: 'fullName', label: 'Họ tên', icon: UserRound },
  { key: 'studentId', label: 'Mã sinh viên', icon: UserRound },
  { key: 'email', label: 'Email', icon: Mail }
]

function resourceLinks(user) {
  return [
    { title: 'GitHub', note: 'Mã nguồn dự án', icon: Github, href: user?.githubLink || '#' },
    { title: 'Figma', note: 'Thiết kế giao diện', icon: Palette, href: user?.figmaLink || '#' },
    {
      title: 'Postman',
      note: 'REST API collection',
      icon: Send,
      href: user?.postmanLink || POSTMAN_FILE,
      download: true
    },
    { title: 'PDF', note: 'Báo cáo bài tập lớn', icon: FileText, href: user?.pdfLink || PDF_FILE }
  ]
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(getUser())
  const show = (key) => user?.[key] || DEFAULT_USER[key]

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => {})
  }, [])

  function logout() {
    clearAuth()
    navigate('/login')
  }

  const logoutButton = (
    <button className="secondary-button" onClick={logout}>
      <LogOut size={16} />
      Đăng xuất
    </button>
  )

  return (
    <div className="page">
      <PageHeader
        title="Hồ sơ"
        subtitle="Thông tin tài khoản và các liên kết tài nguyên của dự án"
        right={logoutButton}
      />

      <div className="profile-layout">
        <section className="card profile-summary">
          <div className="profile-avatar">{initialOf(show('fullName'))}</div>
          <h2>{show('fullName')}</h2>
          <p>{show('studentId')}</p>
          <span className="role-badge">
            <ShieldCheck size={15} />
            {show('role')}
          </span>
        </section>

        <section className="card profile-details">
          <h3>Thông tin cá nhân</h3>
          {INFO_ROWS.map(({ key, label, icon: Icon }) => (
            <div key={key} className="profile-info-row">
              <Icon size={18} />
              <span>{label}</span>
              <strong>{show(key)}</strong>
            </div>
          ))}

          <div className="resource-grid">
            {resourceLinks(user).map(({ title, note, icon: Icon, href, download }) => (
              <a
                key={title}
                href={href}
                className="resource-card"
                {...(download ? { download: true } : { target: '_blank', rel: 'noreferrer' })}
              >
                <Icon />
                <span>
                  <b>{title}</b>
                  <small>{note}</small>
                </span>
                <ExternalLink size={17} />
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
