import { useState } from 'react'

export default function Navbar({ title, user }) {
  const [search, setSearch] = useState('')

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'NA'

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-breadcrumb">
          <span>Home</span>
          <span style={{ opacity: 0.5 }}>/</span>
          <span>{title}</span>
        </div>
      </div>

      <div className="topbar-right">
        <div className="topbar-search" style={{ marginRight: 4 }}>
          <span className="topbar-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search staff, projects…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button className="topbar-icon-btn" aria-label="Notifications" title="Notifications">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
          </svg>
        </button>

        <div style={{ width: 1, height: 22, background: 'var(--border)', margin: '0 6px' }} />

        <div className="topbar-user-info">
          <div className="topbar-user-name">{user?.name || 'Admin User'}</div>
          <div className="topbar-user-role">{user?.role || 'Administrator'}</div>
        </div>
        <div className="topbar-avatar">{initials}</div>
      </div>
    </header>
  )
}
