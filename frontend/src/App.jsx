import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Login                      from './pages/Login.jsx'
import Dashboard           from './pages/Dashboard.jsx'
import StaffProfiles       from './pages/StaffProfiles.jsx'
import Certifications      from './pages/Certifications.jsx'
import ProjectStatus       from './pages/ProjectStatus.jsx'
import ProjectAIAllocation from './pages/ProjectAIAllocation.jsx'
import StaffID             from './pages/StaffID.jsx'
import MyProfile           from './pages/MyProfile.jsx'
import Settings            from './pages/Settings.jsx'
import Sidebar             from './components/Sidebar.jsx'
import Navbar              from './components/Navbar.jsx'
import { authAPI }         from './utils/api'

const PAGE_TITLES = {
  '/':              'Dashboard',
  '/staff':         'Staff Profiles',
  '/certifications':'Certifications',
  '/projects':      'Project Status',
  '/allocation':    'Project AI Allocation',
  '/staff-id':      'Staff ID',
  '/my-profile':    'My Profile',
  '/settings':      'Settings',
}

function ProtectedLayout({ children, user, onLogout }) {
  const location = useLocation()
  const title    = PAGE_TITLES[location.pathname] || 'Dashboard'
  return (
    <div className="app-shell">
      <Sidebar activePath={location.pathname} onLogout={onLogout} user={user} />
      <div className="app-body">
        <Navbar title={title} user={user} onLogout={onLogout} />
        <main className="app-main">
          <div className="page-content">{children}</div>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  const navigate  = useNavigate()
  const [user,    setUser]    = useState(() => {
    try { return JSON.parse(localStorage.getItem('spa_user') || 'null') } catch { return null }
  })
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    authAPI.getSessionUser()
      .then(sessionUser => {
        if (sessionUser) {
          if (String(sessionUser.role || '').toLowerCase() === 'admin') {
            setUser(sessionUser)
            localStorage.setItem('spa_user', JSON.stringify(sessionUser))
          } else {
            localStorage.removeItem('spa_user')
            localStorage.removeItem('spa_token')
            setUser(null)
          }
        } else {
          localStorage.removeItem('spa_user')
          localStorage.removeItem('spa_token')
          setUser(null)
        }
      })
      .catch(() => {})
      .finally(() => setBooting(false))
  }, [])

  const handleLogin = (userData) => {
    if (String(userData?.role || '').toLowerCase() !== 'admin') {
      localStorage.removeItem('spa_user')
      localStorage.removeItem('spa_token')
      setUser(null)
      navigate('/login')
      return
    }
    setUser(userData)
    localStorage.setItem('spa_user', JSON.stringify(userData))
    navigate('/')
  }

  const handleLogout = async () => {
    try { await authAPI.logout() } catch {}
    setUser(null)
    localStorage.removeItem('spa_user')
    localStorage.removeItem('spa_token')
    navigate('/login')
  }

  if (booting) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#fff', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 52, height: 52,
            border: '3px solid rgba(124,92,255,0.18)',
            borderTopColor: '#7c5cff',
            borderRightColor: '#38bdf8',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 18px',
          }}></div>
          <div style={{
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}>
            Loading SPA Portal
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const isLoggedIn = Boolean(user && String(user.role || '').toLowerCase() === 'admin')

  if (!isLoggedIn) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="*"      element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/" element={
        <ProtectedLayout user={user} onLogout={handleLogout}><Dashboard /></ProtectedLayout>
      } />
      <Route path="/staff" element={
        <ProtectedLayout user={user} onLogout={handleLogout}><StaffProfiles /></ProtectedLayout>
      } />
      <Route path="/certifications" element={
        <ProtectedLayout user={user} onLogout={handleLogout}><Certifications /></ProtectedLayout>
      } />
      <Route path="/projects" element={
        <ProtectedLayout user={user} onLogout={handleLogout}><ProjectStatus /></ProtectedLayout>
      } />
      <Route path="/allocation" element={
        <ProtectedLayout user={user} onLogout={handleLogout}><ProjectAIAllocation /></ProtectedLayout>
      } />
      <Route path="/staff-id" element={
        <ProtectedLayout user={user} onLogout={handleLogout}><StaffID /></ProtectedLayout>
      } />
      <Route path="/my-profile" element={
        <ProtectedLayout user={user} onLogout={handleLogout}><MyProfile user={user} /></ProtectedLayout>
      } />
      <Route path="/settings" element={
        <ProtectedLayout user={user} onLogout={handleLogout}><Settings /></ProtectedLayout>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}