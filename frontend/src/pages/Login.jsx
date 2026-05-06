import { useState } from 'react'
import { authAPI } from '../utils/api'

const Icon = ({ name, size = 16, color = 'currentColor' }) => {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (name === 'login') return <svg {...props}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/></svg>
  if (name === 'mail') return <svg {...props}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>
  if (name === 'lock') return <svg {...props}><rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>
  if (name === 'eyeOff') return <svg {...props}><path d="M3 3l18 18"/><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/><path d="M9.9 4.3A10.7 10.7 0 0 1 12 4c5 0 9 5 9 8a9.5 9.5 0 0 1-2 3.3"/><path d="M6.6 6.6C4.4 8 3 10.2 3 12c0 3 4 8 9 8a10.5 10.5 0 0 0 4.2-.9"/></svg>
  return <svg {...props}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>
}

export default function Login({ onLogin }) {
  const [form, setForm]       = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.username || !form.password) {
      setError('Please enter admin username/email and password.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const data = await authAPI.login(form.username, form.password)
      localStorage.setItem('spa_token', data.token)
      onLogin({ ...data.user, avatar: null })
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg, #0f1117)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
        background: 'linear-gradient(to bottom, rgba(56,189,248,0.06), rgba(15,17,23,0))',
        borderRadius: 24,
        boxShadow: '0 8px 40px rgba(0,0,0,0.45)',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        border: '1px solid rgba(56,189,248,0.13)',
      }}>

        {/* Icon */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 56,
          height: 56,
          borderRadius: 16,
          background: 'rgba(56,189,248,0.1)',
          marginBottom: 24,
          boxShadow: '0 2px 12px rgba(56,189,248,0.15)',
          border: '1px solid rgba(56,189,248,0.18)',
        }}>
          <Icon name="login" size={26} color="#38bdf8" />
        </div>

        {/* Heading */}
        <h2 style={{
          fontSize: 22,
          fontWeight: 700,
          marginBottom: 6,
          textAlign: 'center',
          color: 'var(--text, #f1f5f9)',
          letterSpacing: '-0.02em',
        }}>
          SPA Admin Portal
        </h2>
        <p style={{
          color: 'var(--text-muted, #94a3b8)',
          fontSize: 13,
          marginBottom: 28,
          textAlign: 'center',
        }}>
          Secure access for authorized administrators only
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Email */}
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              color: '#64748b', display: 'flex',
            }}>
              <Icon name="mail" size={16} />
            </span>
            <input
              type="text"
              placeholder="Admin username or email"
              value={form.username}
              autoFocus
              required
              onChange={e => setForm({ ...form, username: e.target.value })}
              style={{
                width: '100%',
                paddingLeft: 38,
                paddingRight: 12,
                paddingTop: 9,
                paddingBottom: 9,
                borderRadius: 12,
                border: '1px solid rgba(100,116,139,0.35)',
                background: 'rgba(255,255,255,0.04)',
                color: 'var(--text, #f1f5f9)',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#38bdf8'}
              onBlur={e => e.target.style.borderColor = 'rgba(100,116,139,0.35)'}
            />
          </div>

          {/* Password */}
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              color: '#64748b', display: 'flex',
            }}>
              <Icon name="lock" size={16} />
            </span>
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Enter your password"
              value={form.password}
              required
              onChange={e => setForm({ ...form, password: e.target.value })}
              style={{
                width: '100%',
                paddingLeft: 38,
                paddingRight: 40,
                paddingTop: 9,
                paddingBottom: 9,
                borderRadius: 12,
                border: '1px solid rgba(100,116,139,0.35)',
                background: 'rgba(255,255,255,0.04)',
                color: 'var(--text, #f1f5f9)',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#38bdf8'}
              onBlur={e => e.target.style.borderColor = 'rgba(100,116,139,0.35)'}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#64748b', display: 'flex', padding: 2,
              }}
              aria-label="Toggle password visibility"
            >
              {showPass ? <Icon name="eyeOff" size={15} /> : <Icon name="eye" size={15} />}
            </button>
          </div>

          {/* Error + Forgot row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 20 }}>
            {error ? (
              <span style={{ fontSize: 12, color: '#f87171' }}>{error}</span>
            ) : <span />}
            <button
              type="button"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 12, color: '#38bdf8', fontWeight: 500,
              }}
              onClick={e => e.preventDefault()}
            >
              Admin only
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px 0',
              borderRadius: 12,
              border: 'none',
              background: loading
                ? 'rgba(56,189,248,0.25)'
                : 'linear-gradient(135deg, #38bdf8 0%, #7c5cff 100%)',
              color: '#fff',
              fontWeight: 600,
              fontSize: 14,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'opacity 0.2s',
              letterSpacing: '0.01em',
            }}
          >
            {loading ? (
              <>
                <span style={{
                  width: 15, height: 15,
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.7s linear infinite',
                }} />
                Signing in…
              </>
            ) : (
              'Login as Admin'
            )}
          </button>
        </form>

        {/* Spin keyframe */}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}