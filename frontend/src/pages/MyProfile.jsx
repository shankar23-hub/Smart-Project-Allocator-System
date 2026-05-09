import { useState, useEffect } from 'react'
import { authAPI } from '../utils/api'

const AVATAR_COLORS = ['#7c5cff', '#38bdf8', '#22c55e', '#f59e0b', '#ef4d6a', '#a855f7']

export default function MyProfile({ user }) {
  const [editing, setEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const [toast, setToast] = useState(null)

  const [form, setForm] = useState({
    name: user?.name || 'Admin User',
    email: user?.email || 'admin@spa.com',
    role: user?.role || 'Administrator',
    dept: user?.dept || 'Management',
    mobile: user?.mobile || '+91 98765 43210',
    dob: user?.dob || '',
    doj: user?.doj || '',
    address: user?.address || '',
    bio: user?.bio || 'Senior administrator managing enterprise operations at SPA Technologies.',
    color: 0,
  })

  const [pwForm, setPwForm] = useState({
    current: '',
    next: '',
    confirm: '',
  })

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    authAPI
      .getSessionUser()
      .then((data) => {
        if (data) {
          setForm((f) => ({
            ...f,
            name: data.name || f.name,
            email: data.email || f.email,
            role: data.role || f.role,
            dept: data.dept || f.dept,
            mobile: data.mobile || f.mobile,
            dob: data.dob || f.dob,
            doj: data.doj || f.doj,
            address: data.address || f.address,
            bio: data.bio || f.bio,
          }))
        }
      })
      .catch(() => {})
  }, [])

  const set = (key, value) => {
    setForm((f) => ({
      ...f,
      [key]: value,
    }))
  }

  const setPw = (key, value) => {
    setPwForm((f) => ({
      ...f,
      [key]: value,
    }))
  }

  const initials = form.name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      showToast('Name and email are required', 'error')
      return
    }

    setSaving(true)

    try {
      const updated = await authAPI.updateProfile(form)

      try {
        const cached = JSON.parse(localStorage.getItem('spa_user') || '{}')
        localStorage.setItem('spa_user', JSON.stringify({ ...cached, ...updated }))
      } catch {}

      showToast('✅ Profile saved successfully!')
    } catch (err) {
      try {
        const cached = JSON.parse(localStorage.getItem('spa_user') || '{}')
        localStorage.setItem('spa_user', JSON.stringify({ ...cached, ...form }))
      } catch {}

      showToast(err.message || 'Profile saved locally only', 'error')
    }

    setEditing(false)
    setSaving(false)
  }

  const handleCancelEdit = () => {
    setEditing(false)
  }

  const handleChangePassword = async () => {
    if (!pwForm.current) {
      showToast('Current password is required', 'error')
      return
    }

    if (!pwForm.next || pwForm.next.length < 6) {
      showToast('New password must be at least 6 characters', 'error')
      return
    }

    if (pwForm.next !== pwForm.confirm) {
      showToast('New passwords do not match', 'error')
      return
    }

    setPwSaving(true)

    try {
      await authAPI.changePassword({
        currentPassword: pwForm.current,
        newPassword: pwForm.next,
      })

      showToast('🔐 Password updated successfully!')
      setPwForm({
        current: '',
        next: '',
        confirm: '',
      })
    } catch (err) {
      showToast(err.message || 'Could not connect to server', 'error')
    }

    setPwSaving(false)
  }

  const activityLog = [
    { action: 'Logged in to Portal', time: 'Just now', icon: '🔐' },
    { action: 'Generated Staff ID for Ravi Kumar', time: '2 hrs ago', icon: '🪪' },
    { action: 'Added new staff: Divya Rao', time: '1 day ago', icon: '👤' },
    { action: 'Updated Project Status: AI Dashboard', time: '2 days ago', icon: '📊' },
    { action: 'Ran AI Allocation for SPA Mobile App', time: '3 days ago', icon: '🤖' },
    { action: 'Changed portal settings', time: '1 week ago', icon: '⚙️' },
  ]

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 9999,
            padding: '13px 20px',
            borderRadius: 13,
            fontWeight: 600,
            fontSize: 14,
            background: toast.type === 'error' ? '#ef4d6a' : '#06d6a0',
            color: '#fff',
            boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
            animation: '_toastIn 0.3s ease',
          }}
        >
          {toast.type === 'error' ? '⚠️' : '✅'} {toast.msg}
        </div>
      )}

      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>My Profile 👤</h1>
            <p>Manage your personal information and account settings</p>
          </div>
        </div>
      </div>

      {/* Hero Card */}
      <div
        style={{
          background: 'linear-gradient(135deg,#0d0f18,#161924,#1a1f2e)',
          border: '1px solid var(--panel-border)',
          borderRadius: 'var(--radius-xl)',
          padding: 32,
          marginBottom: 24,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -60,
            right: -60,
            width: 240,
            height: 240,
            borderRadius: '50%',
            background: 'rgba(239,77,106,0.07)',
          }}
        ></div>

        <div
          style={{
            position: 'absolute',
            bottom: -40,
            left: 200,
            width: 160,
            height: 160,
            borderRadius: '50%',
            background: 'rgba(76,201,240,0.05)',
          }}
        ></div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 28,
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div style={{ position: 'relative' }}>
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: 22,
                background: AVATAR_COLORS[form.color],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 36,
                fontWeight: 800,
                color: '#fff',
                boxShadow: `0 8px 32px ${AVATAR_COLORS[form.color]}50`,
                border: '3px solid rgba(255,255,255,0.1)',
              }}
            >
              {initials}
            </div>

            {editing && (
              <div
                style={{
                  display: 'flex',
                  gap: 4,
                  marginTop: 8,
                  flexWrap: 'wrap',
                  maxWidth: 100,
                }}
              >
                {AVATAR_COLORS.map((color, index) => (
                  <div
                    key={index}
                    onClick={() => set('color', index)}
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: color,
                      cursor: 'pointer',
                      border:
                        form.color === index
                          ? '2px solid #fff'
                          : '2px solid transparent',
                    }}
                  ></div>
                ))}
              </div>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: '-0.5px',
                marginBottom: 4,
              }}
            >
              {form.name}
            </div>

            <div
              style={{
                fontSize: 15,
                color: 'var(--primary)',
                fontWeight: 600,
                marginBottom: 10,
              }}
            >
              {form.role} · {form.dept}
            </div>

            <div
              style={{
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  color: 'var(--text-muted)',
                }}
              >
                📧 {form.email}
              </span>

              {form.mobile && (
                <span
                  style={{
                    fontSize: 13,
                    color: 'var(--text-muted)',
                  }}
                >
                  📱 {form.mobile}
                </span>
              )}

              {form.doj && (
                <span
                  style={{
                    fontSize: 13,
                    color: 'var(--text-muted)',
                  }}
                >
                  📅 Joined {form.doj}
                </span>
              )}
            </div>

            {form.bio && (
              <div
                style={{
                  marginTop: 10,
                  fontSize: 13,
                  color: 'var(--text-soft)',
                  maxWidth: 500,
                  lineHeight: 1.6,
                }}
              >
                {form.bio}
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              gap: 8,
            }}
          >
            {editing ? (
              <>
                <button className="btn btn-outline btn-sm" onClick={handleCancelEdit}>
                  Cancel
                </button>

                <button
                  className="btn btn-primary btn-sm"
                  disabled={saving}
                  onClick={handleSave}
                >
                  {saving ? '⏳ Saving...' : '💾 Save Profile'}
                </button>
              </>
            ) : (
              <button className="btn btn-outline" onClick={() => setEditing(true)}>
                ✏️ Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        {['profile', 'security', 'activity'].map((tab) => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
            style={{ textTransform: 'capitalize' }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div className="card" style={{ padding: 28 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--primary)',
              marginBottom: 18,
            }}
          >
            Personal Information
            {!editing && (
              <span
                style={{
                  marginLeft: 12,
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  fontWeight: 400,
                  textTransform: 'none',
                }}
              >
                Click "Edit Profile" above to modify
              </span>
            )}
          </div>

          <div className="form-grid" style={{ marginBottom: 20 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Full Name *</label>
              <input
                className="form-control"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                disabled={!editing}
                style={{ opacity: editing ? 1 : 0.7 }}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Email Address *</label>
              <input
                className="form-control"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                disabled={!editing}
                style={{ opacity: editing ? 1 : 0.7 }}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Role</label>
              <input
                className="form-control"
                value={form.role}
                onChange={(e) => set('role', e.target.value)}
                disabled={!editing}
                style={{ opacity: editing ? 1 : 0.7 }}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Department</label>
              <input
                className="form-control"
                value={form.dept}
                onChange={(e) => set('dept', e.target.value)}
                disabled={!editing}
                style={{ opacity: editing ? 1 : 0.7 }}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Mobile Number</label>
              <input
                className="form-control"
                value={form.mobile}
                onChange={(e) => set('mobile', e.target.value)}
                disabled={!editing}
                style={{ opacity: editing ? 1 : 0.7 }}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Date of Birth</label>
              <input
                className="form-control"
                type="date"
                value={form.dob}
                onChange={(e) => set('dob', e.target.value)}
                disabled={!editing}
                style={{ opacity: editing ? 1 : 0.7 }}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Date of Joining</label>
              <input
                className="form-control"
                type="date"
                value={form.doj}
                onChange={(e) => set('doj', e.target.value)}
                disabled={!editing}
                style={{ opacity: editing ? 1 : 0.7 }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Address</label>
            <input
              className="form-control"
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              disabled={!editing}
              style={{ opacity: editing ? 1 : 0.7 }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Bio</label>
            <textarea
              className="form-control"
              value={form.bio}
              onChange={(e) => set('bio', e.target.value)}
              disabled={!editing}
              rows={3}
              style={{
                resize: 'vertical',
                opacity: editing ? 1 : 0.7,
              }}
            />
          </div>

          {editing && (
            <div
              style={{
                display: 'flex',
                gap: 10,
                marginTop: 8,
                paddingTop: 16,
                borderTop: '1px solid var(--panel-border)',
              }}
            >
              <button
                className="btn btn-outline"
                onClick={handleCancelEdit}
                style={{ flex: 1 }}
              >
                Cancel
              </button>

              <button
                className="btn btn-primary"
                disabled={saving}
                onClick={handleSave}
                style={{ flex: 2 }}
              >
                {saving ? '⏳ Saving...' : '💾 Save Profile'}
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'security' && (
        <div className="card" style={{ padding: 28 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--primary)',
              marginBottom: 18,
            }}
          >
            Change Password
          </div>

          <div style={{ maxWidth: 420 }}>
            <div className="form-group">
              <label className="form-label">Current Password *</label>
              <input
                className="form-control"
                type="password"
                value={pwForm.current}
                onChange={(e) => setPw('current', e.target.value)}
                placeholder="Enter current password"
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password *</label>
              <input
                className="form-control"
                type="password"
                value={pwForm.next}
                onChange={(e) => setPw('next', e.target.value)}
                placeholder="At least 6 characters"
              />

              {pwForm.next && pwForm.next.length < 6 && (
                <div
                  style={{
                    fontSize: 11,
                    color: '#ef4d6a',
                    marginTop: 4,
                  }}
                >
                  Password must be at least 6 characters
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password *</label>
              <input
                className="form-control"
                type="password"
                value={pwForm.confirm}
                onChange={(e) => setPw('confirm', e.target.value)}
                placeholder="Re-enter new password"
              />

              {pwForm.confirm && pwForm.next !== pwForm.confirm && (
                <div
                  style={{
                    fontSize: 11,
                    color: '#ef4d6a',
                    marginTop: 4,
                  }}
                >
                  Passwords do not match
                </div>
              )}

              {pwForm.confirm &&
                pwForm.next === pwForm.confirm &&
                pwForm.confirm.length >= 6 && (
                  <div
                    style={{
                      fontSize: 11,
                      color: '#06d6a0',
                      marginTop: 4,
                    }}
                  >
                    ✓ Passwords match
                  </div>
                )}
            </div>

            <button
              className="btn btn-primary"
              disabled={pwSaving}
              onClick={handleChangePassword}
            >
              {pwSaving ? '⏳ Updating...' : '🔐 Update Password'}
            </button>
          </div>

          <div className="divider" />

          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--primary)',
              marginBottom: 18,
            }}
          >
            Session Information
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
            }}
          >
            {[
              { label: 'Last Login', value: 'Today, Just now' },
              { label: 'Login IP', value: '192.168.1.1' },
              { label: 'Browser', value: 'Chrome' },
              { label: 'OS', value: 'Windows / macOS' },
            ].map((item) => (
              <div key={item.label} className="profile-detail-item">
                <div className="profile-detail-label">{item.label}</div>
                <div className="profile-detail-value">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="card" style={{ padding: 28 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--primary)',
              marginBottom: 18,
            }}
          >
            Recent Activity Log
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {activityLog.map((activity, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '12px 16px',
                  background: 'var(--bg3)',
                  borderRadius: 10,
                  border: '1px solid var(--panel-border)',
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: 'rgba(239,77,106,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                >
                  {activity.icon}
                </div>

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 500,
                    }}
                  >
                    {activity.action}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {activity.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes _toastIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}