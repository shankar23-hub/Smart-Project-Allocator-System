import { useState } from 'react'

function Toggle({ on, onChange }) {
  return (
    <button className={`toggle ${on ? 'on' : ''}`} onClick={() => onChange(!on)}>
      <div className="toggle-knob"></div>
    </button>
  )
}

function SettingSection({ title, icon, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>{icon}</div>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{title}</div>
      </div>
      <div className="settings-panel">{children}</div>
    </div>
  )
}

export default function Settings() {
  const [settings, setSettings] = useState({
    emailNotif: true, pushNotif: false, smsNotif: true,
    projectUpdates: true, staffAlerts: true, aiAlerts: false,
    darkMode: true, compactView: false, animations: true,
    twoFA: false, sessionTimeout: true, auditLog: true,
    autoBackup: true, dataExport: false,
  })
  const [saved, setSaved] = useState(false)
  const [companyName, setCompanyName] = useState('SPA Technologies')
  const [timezone, setTimezone] = useState('Asia/Kolkata')
  const [language, setLanguage] = useState('English')
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY')

  const toggle = key => setSettings(s => ({ ...s, [key]: !s[key] }))

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Settings ⚙️</h1>
            <p>Configure portal preferences, notifications and security</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {saved && <span className="badge badge-success">✅ Settings Saved!</span>}
            <button className="btn btn-primary" onClick={handleSave}>💾 Save All Settings</button>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 24 }}>
        <div>
          {/* Company Settings */}
          <SettingSection title="Company Configuration" icon="🏢">
            <div style={{ padding: 20 }}>
              <div className="form-group">
                <label className="form-label">Company Name</label>
                <input className="form-control" value={companyName} onChange={e => setCompanyName(e.target.value)} />
              </div>
              <div className="form-grid">
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Timezone</label>
                  <select className="form-control" value={timezone} onChange={e => setTimezone(e.target.value)}>
                    <option>Asia/Kolkata</option>
                    <option>UTC</option>
                    <option>America/New_York</option>
                    <option>Europe/London</option>
                    <option>Asia/Singapore</option>
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Language</label>
                  <select className="form-control" value={language} onChange={e => setLanguage(e.target.value)}>
                    <option>English</option>
                    <option>Hindi</option>
                    <option>Tamil</option>
                    <option>Telugu</option>
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Date Format</label>
                  <select className="form-control" value={dateFormat} onChange={e => setDateFormat(e.target.value)}>
                    <option>DD/MM/YYYY</option>
                    <option>MM/DD/YYYY</option>
                    <option>YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </div>
          </SettingSection>

          {/* Notifications */}
          <SettingSection title="Notifications" icon="🔔">
            {[
              { key: 'emailNotif', title: 'Email Notifications', desc: 'Receive important updates via email' },
              { key: 'pushNotif', title: 'Push Notifications', desc: 'Browser push notifications' },
              { key: 'smsNotif', title: 'SMS Alerts', desc: 'Critical alerts via SMS' },
              { key: 'projectUpdates', title: 'Project Updates', desc: 'Notify on project status changes' },
              { key: 'staffAlerts', title: 'Staff Alerts', desc: 'New staff onboarding & changes' },
              { key: 'aiAlerts', title: 'AI Allocation Alerts', desc: 'Notify when AI run completes' },
            ].map(s => (
              <div key={s.key} className="settings-row">
                <div className="settings-row-info">
                  <h4>{s.title}</h4>
                  <p>{s.desc}</p>
                </div>
                <Toggle on={settings[s.key]} onChange={() => toggle(s.key)} />
              </div>
            ))}
          </SettingSection>
        </div>

        <div>
          {/* Appearance */}
          <SettingSection title="Appearance" icon="🎨">
            {[
              { key: 'darkMode', title: 'Dark Mode', desc: 'Use dark theme (recommended)' },
              { key: 'compactView', title: 'Compact View', desc: 'Reduce spacing for more content' },
              { key: 'animations', title: 'Animations', desc: 'Enable UI transitions & animations' },
            ].map(s => (
              <div key={s.key} className="settings-row">
                <div className="settings-row-info">
                  <h4>{s.title}</h4>
                  <p>{s.desc}</p>
                </div>
                <Toggle on={settings[s.key]} onChange={() => toggle(s.key)} />
              </div>
            ))}
          </SettingSection>

          {/* Security */}
          <SettingSection title="Security & Privacy" icon="🔒">
            {[
              { key: 'twoFA', title: 'Two-Factor Authentication', desc: 'Extra layer of security (TOTP)' },
              { key: 'sessionTimeout', title: 'Session Timeout', desc: 'Auto logout after 30 min inactivity' },
              { key: 'auditLog', title: 'Audit Logging', desc: 'Log all admin actions' },
            ].map(s => (
              <div key={s.key} className="settings-row">
                <div className="settings-row-info">
                  <h4>{s.title}</h4>
                  <p>{s.desc}</p>
                </div>
                <Toggle on={settings[s.key]} onChange={() => toggle(s.key)} />
              </div>
            ))}
          </SettingSection>

          {/* Data Management */}
          <SettingSection title="Data Management" icon="💾">
            {[
              { key: 'autoBackup', title: 'Auto Backup', desc: 'Daily automated data backup' },
              { key: 'dataExport', title: 'Data Export Mode', desc: 'Enable bulk export features' },
            ].map(s => (
              <div key={s.key} className="settings-row">
                <div className="settings-row-info">
                  <h4>{s.title}</h4>
                  <p>{s.desc}</p>
                </div>
                <Toggle on={settings[s.key]} onChange={() => toggle(s.key)} />
              </div>
            ))}
            <div className="settings-row">
              <div className="settings-row-info">
                <h4>Export All Data</h4>
                <p>Download complete portal data as CSV/JSON</p>
              </div>
              <button className="btn btn-outline btn-sm">📥 Export</button>
            </div>
            <div className="settings-row">
              <div className="settings-row-info">
                <h4 style={{ color: 'var(--primary)' }}>Reset Portal Data</h4>
                <p>Clear all staff & project data (irreversible)</p>
              </div>
              <button className="btn btn-danger btn-sm">⚠️ Reset</button>
            </div>
          </SettingSection>

          {/* About */}
          <div className="card" style={{ padding: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: 14 }}>About SPA Portal</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Portal Version', value: 'v2.0.0' },
                { label: 'Build Date', value: 'March 2026' },
                { label: 'Backend', value: 'Python Flask + SQLite' },
                { label: 'Frontend', value: 'React 18 + Vite' },
                { label: 'AI Engine', value: 'Custom Scoring Algorithm' },
              ].map(f => (
                <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{f.label}</span>
                  <span style={{ fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text)' }}>{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
