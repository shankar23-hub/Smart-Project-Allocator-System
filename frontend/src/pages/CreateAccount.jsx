import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authAPI } from '../utils/api'

const ROLES = ['Administrator', 'Project Manager', 'HR Manager', 'Operations Lead']

const FEATURES = [
  { icon: '🍃', title: 'MongoDB-secured', sub: 'Your data, encrypted and persisted' },
  { icon: '🔐', title: 'JWT-authenticated sessions', sub: 'Industry-standard security' },
  { icon: '🤖', title: 'AI-powered allocation', sub: 'Intelligent resource matching' },
  { icon: '📊', title: 'Real-time dashboards', sub: 'Live operational insights' },
]

export default function CreateAccount({ onLogin }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'Administrator',
    password: '',
    confirm: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showCp, setShowCp] = useState(false)

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    try {
      const data = await authAPI.signup({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        dept: 'Management',
      })
      localStorage.setItem('spa_token', data.token)
      setSuccess('Account created! Signing you in…')
      setTimeout(() => onLogin({ ...data.user, avatar: null }), 800)
    } catch (err) {
      setError(err.message || 'Unable to create account. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-bg-orb auth-bg-orb-1"></div>
      <div className="auth-bg-orb auth-bg-orb-2"></div>

      {/* ── Left brand panel ── */}
      <div className="auth-left">
        <div className="auth-left-content animate-fade-in-up">
          <div className="auth-brand-big">
            <img src="/spa-logo.png" alt="SPA" onError={(e) => { e.target.style.display = 'none' }} />
            <h2>
              SPA
              <small>Admin Portal</small>
            </h2>
          </div>

          <h1 className="auth-headline">
            Get started with the <span>SPA workspace.</span>
          </h1>
          <p className="auth-tagline">
            Register your portal administrator and start managing staff, projects, and AI-powered resource allocation from a single command center.
          </p>

          <div className="auth-feature-list">
            {FEATURES.map((f) => (
              <div key={f.title} className="auth-feature">
                <div className="auth-feature-icon">{f.icon}</div>
                <div className="auth-feature-text">
                  {f.title}
                  <small>{f.sub}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-right">
        <div className="auth-form-wrap animate-fade-in-up">
          <div className="auth-form-header">
            <img src="/spa-logo.png" alt="SPA" onError={(e) => { e.target.style.display = 'none' }} />
            <h2>Create your account</h2>
            <p>Set up the first administrator for your portal</p>
          </div>

          {error && (
            <div className="auth-error">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="auth-success">
              <span>✅</span>
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Full Name</label>
              <div className="auth-input-wrap" style={{ marginBottom: 0 }}>
                <span className="input-icon">👤</span>
                <input
                  className="form-control"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={set('name')}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Email Address</label>
              <div className="auth-input-wrap" style={{ marginBottom: 0 }}>
                <span className="input-icon">✉️</span>
                <input
                  type="email"
                  className="form-control"
                  placeholder="admin@spa.com"
                  value={form.email}
                  onChange={set('email')}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Role</label>
              <select
                className="form-control"
                value={form.role}
                onChange={set('role')}
              >
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Password</label>
              <div className="auth-input-wrap" style={{ marginBottom: 0 }}>
                <span className="input-icon">🔒</span>
                <input
                  type={showPw ? 'text' : 'password'}
                  className="form-control"
                  placeholder="At least 6 characters"
                  value={form.password}
                  onChange={set('password')}
                  required
                />
                <button
                  type="button"
                  className="input-toggle"
                  onClick={() => setShowPw(!showPw)}
                  aria-label="Toggle password visibility"
                >
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 18 }}>
              <label className="form-label">Confirm Password</label>
              <div className="auth-input-wrap" style={{ marginBottom: 0 }}>
                <span className="input-icon">🔒</span>
                <input
                  type={showCp ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Repeat your password"
                  value={form.confirm}
                  onChange={set('confirm')}
                  required
                />
                <button
                  type="button"
                  className="input-toggle"
                  onClick={() => setShowCp(!showCp)}
                  aria-label="Toggle confirm password visibility"
                >
                  {showCp ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg auth-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  <span>Creating account…</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
