import { NavLink } from 'react-router-dom'

/* ── Inline SVG icons (no external deps) ── */
const Icon = ({ name }) => {
  const sw = 1.7
  const props = {
    width: 18, height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: sw,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }
  switch (name) {
    case 'dashboard':
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="9" rx="1.5" />
          <rect x="14" y="3" width="7" height="5" rx="1.5" />
          <rect x="14" y="12" width="7" height="9" rx="1.5" />
          <rect x="3" y="16" width="7" height="5" rx="1.5" />
        </svg>
      )
    case 'staff':
      return (
        <svg {...props}>
          <circle cx="9" cy="8" r="3.2" />
          <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
          <circle cx="17" cy="6.5" r="2.4" />
          <path d="M15 14.5c1-.4 2-.5 2.7-.5 2.5 0 4.3 1.7 4.3 4" />
        </svg>
      )
    case 'cert':
      return (
        <svg {...props}>
          <circle cx="12" cy="9.5" r="5" />
          <path d="M9 14l-1.5 6 4-2.5L15.5 20 14 14" />
        </svg>
      )
    case 'project':
      return (
        <svg {...props}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M3 9h18" />
          <path d="M8 4v3" />
          <path d="M16 4v3" />
        </svg>
      )
    case 'allocation':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 5V3M12 21v-2M5 12H3M21 12h-2M6.3 6.3L4.9 4.9M19.1 19.1l-1.4-1.4M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4" />
        </svg>
      )
    case 'id':
      return (
        <svg {...props}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="9" cy="11.5" r="2.2" />
          <path d="M5.5 17c.5-1.6 1.9-2.8 3.5-2.8s3 1.2 3.5 2.8" />
          <path d="M14.5 10h4M14.5 13h3" />
        </svg>
      )
    case 'profile':
      return (
        <svg {...props}>
          <circle cx="12" cy="8.5" r="3.5" />
          <path d="M5 20c0-3.5 3-6.3 7-6.3S19 16.5 19 20" />
        </svg>
      )
    case 'settings':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="2.6" />
          <path d="M19.4 14.6a2 2 0 0 0 .4 2.2l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a2 2 0 0 0-2.2-.4 2 2 0 0 0-1.2 1.8V21a2 2 0 1 1-4 0v-.1a2 2 0 0 0-1.3-1.8 2 2 0 0 0-2.2.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a2 2 0 0 0 .4-2.2 2 2 0 0 0-1.8-1.2H3a2 2 0 1 1 0-4h.1a2 2 0 0 0 1.8-1.3 2 2 0 0 0-.4-2.2l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a2 2 0 0 0 2.2.4h.1a2 2 0 0 0 1.2-1.8V3a2 2 0 1 1 4 0v.1a2 2 0 0 0 1.2 1.8 2 2 0 0 0 2.2-.4l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a2 2 0 0 0-.4 2.2v.1a2 2 0 0 0 1.8 1.2H21a2 2 0 1 1 0 4h-.1a2 2 0 0 0-1.8 1.2z" />
        </svg>
      )
    case 'logout':
      return (
        <svg {...props}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="M16 17l5-5-5-5" />
          <path d="M21 12H9" />
        </svg>
      )
    default:
      return null
  }
}

const navItems = [
  { to: '/', label: 'Dashboard', icon: 'dashboard', exact: true },
  { to: '/staff', label: 'Staff Profiles', icon: 'staff' },
  { to: '/certifications', label: 'Certifications', icon: 'cert' },
  { to: '/projects', label: 'Project Status', icon: 'project' },
  { to: '/allocation', label: 'AI Allocation', icon: 'allocation' },
  { to: '/staff-id', label: 'Staff ID', icon: 'id' },
]

const accountItems = [
  { to: '/my-profile', label: 'My Profile', icon: 'profile' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
]

export default function Sidebar({ onLogout, user }) {
  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'NA'

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">
          <img
            src="/spa-logo.png"
            alt="SPA"
            onError={(e) => { e.target.style.display = 'none' }}
          />
          <div>
            <div className="brand-logo-text">
              SPA <span>Admin</span>
            </div>
            <div className="brand-sub">Professional Workspace</div>
          </div>
        </div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-label">Main</div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              <span className="sidebar-link-icon"><Icon name={item.icon} /></span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-label">Account</div>
        <nav className="sidebar-nav">
          {accountItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              <span className="sidebar-link-icon"><Icon name={item.icon} /></span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-user-card">
          <div className="sidebar-user-avatar">{initials}</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="sidebar-user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name || 'Admin User'}
            </div>
            <div className="sidebar-user-role" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.role || 'Administrator'}
            </div>
          </div>
        </div>
        <button className="sidebar-logout-btn" onClick={onLogout}>
          <Icon name="logout" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  )
}
