import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import SensorsPage from './pages/SensorsPage'
import ActionHistoryPage from './pages/ActionHistoryPage'
import ProfilePage from './pages/ProfilePage'
import AppLayout from './components/layout/AppLayout'
import { isAuthenticated } from './services/auth'

function ProtectedLayout() {
  if (!isAuthenticated()) return <Navigate to="/login" replace />
  return <AppLayout />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/sensors" element={<SensorsPage />} />
        <Route path="/history" element={<ActionHistoryPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
