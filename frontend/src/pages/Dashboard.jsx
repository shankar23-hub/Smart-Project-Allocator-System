import { useEffect, useMemo, useState } from 'react'
import { employeeAPI, projectAPI } from '../utils/api'
import { useNavigate } from 'react-router-dom'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const ALL_DATA = {
  Today: [
    { name: '09 AM', staff: 12, projects: 2 },
    { name: '10 AM', staff: 14, projects: 2 },
    { name: '11 AM', staff: 16, projects: 3 },
    { name: '12 PM', staff: 18, projects: 4 },
    { name: '01 PM', staff: 15, projects: 3 },
    { name: '02 PM', staff: 19, projects: 4 },
    { name: '03 PM', staff: 21, projects: 5 },
    { name: '04 PM', staff: 23, projects: 6 },
  ],
  'This Week': [
    { name: 'Mon', staff: 18, projects: 4 },
    { name: 'Tue', staff: 22, projects: 5 },
    { name: 'Wed', staff: 20, projects: 5 },
    { name: 'Thu', staff: 24, projects: 6 },
    { name: 'Fri', staff: 26, projects: 7 },
    { name: 'Sat', staff: 19, projects: 4 },
    { name: 'Sun', staff: 15, projects: 3 },
  ],
  'This Month': [
    { name: 'W1', staff: 72, projects: 14 },
    { name: 'W2', staff: 81, projects: 16 },
    { name: 'W3', staff: 76, projects: 15 },
    { name: 'W4', staff: 88, projects: 18 },
  ],
  'This Year': [
    { name: 'Jan', staff: 46, projects: 8 },
    { name: 'Feb', staff: 51, projects: 9 },
    { name: 'Mar', staff: 49, projects: 8 },
    { name: 'Apr', staff: 58, projects: 10 },
    { name: 'May', staff: 62, projects: 11 },
    { name: 'Jun', staff: 67, projects: 12 },
    { name: 'Jul', staff: 72, projects: 13 },
    { name: 'Aug', staff: 69, projects: 12 },
    { name: 'Sep', staff: 61, projects: 11 },
    { name: 'Oct', staff: 66, projects: 12 },
    { name: 'Nov', staff: 73, projects: 13 },
    { name: 'Dec', staff: 79, projects: 15 },
  ],
}

const ACTIVITY_COLORS = ['#33d1ff', '#f7b500', '#2dd4bf', '#ff4fa3']

const recentFallback = [
  { id: 'AR-1001', title: 'SPA Web Portal', owner: 'Arjun Singh', amount: 'UI Review', date: '02 Apr 2026' },
  { id: 'AR-1002', title: 'Staff Profile Update', owner: 'Priya Sharma', amount: 'Data Sync', date: '04 Apr 2026' },
  { id: 'AR-1003', title: 'Project Allocation', owner: 'Kiran Patel', amount: 'AI Run', date: '06 Apr 2026' },
  { id: 'AR-1004', title: 'Staff ID Batch', owner: 'Meera Nair', amount: 'Generated', date: '07 Apr 2026' },
]

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="dashboard-tooltip">
      <div className="dashboard-tooltip-title">{label}</div>
      {payload.map((item) => (
        <div key={item.dataKey} className="dashboard-tooltip-row">
          <span>{item.name}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  )
}

function StatCard({ title, value, change, icon, tone }) {
  return (
    <div className="neo-stat-card">
      <div className="neo-stat-top">
        <div>
          <div className="neo-stat-title">{title}</div>
          <div className="neo-stat-value">{value}</div>
        </div>
        <div className={`neo-stat-icon ${tone}`}>{icon}</div>
      </div>
      <div className="neo-stat-change">{change}</div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [period, setPeriod] = useState('This Month')
  const [empStats, setEmpStats] = useState({ total: 44, available: 36, busy: 5, onLeave: 3, avgScore: 85 })
  const [projStats, setProjStats] = useState({ total: 24, active: 10, pending: 5, review: 3, completed: 6, avgCompletion: 52 })

  useEffect(() => {
    employeeAPI.getStats().then((data) => setEmpStats((prev) => ({ ...prev, ...data }))).catch(() => {})
    projectAPI.getStats().then((data) => setProjStats((prev) => ({ ...prev, ...data }))).catch(() => {})
  }, [])

  const chartData = ALL_DATA[period]
  const totalStaff = Number(empStats.total || 0)
  const busyStaff = Number(empStats.busy || 0)
  const onLeave = Number(empStats.onLeave || 0)
  const availableStaff = Math.max(totalStaff - busyStaff - onLeave, 0)
  const activeProjects = Number(projStats.active || 0)
  const pendingProjects = Number(projStats.pending || 0)
  const completedProjects = Number(projStats.completed || 0)
  const reviewProjects = Number(projStats.review || 0)

  const activitySegments = useMemo(() => {
    const raw = [activeProjects || 1, pendingProjects || 1, completedProjects || 1, reviewProjects || 1]
    const total = raw.reduce((sum, value) => sum + value, 0)
    const degrees = raw.map((value) => (value / total) * 360)
    let start = -90
    return degrees.map((deg, index) => {
      const segment = `${ACTIVITY_COLORS[index]} ${start}deg ${start + deg}deg`
      start += deg
      return segment
    }).join(', ')
  }, [activeProjects, pendingProjects, completedProjects, reviewProjects])

  const teamRows = [
    { name: 'Available Staff', value: availableStaff, percent: totalStaff ? Math.round((availableStaff / totalStaff) * 100) : 0, color: '#33d1ff' },
    { name: 'Busy Staff', value: busyStaff, percent: totalStaff ? Math.round((busyStaff / totalStaff) * 100) : 0, color: '#f7b500' },
    { name: 'On Leave', value: onLeave, percent: totalStaff ? Math.round((onLeave / totalStaff) * 100) : 0, color: '#ff4fa3' },
  ]

  const projectRows = [
    { name: 'AI Allocation', lead: 'Project Engine', progress: 92, status: 'Running' },
    { name: 'Staff Profiles', lead: 'HR Admin', progress: 86, status: 'Updated' },
    { name: 'Project Status', lead: 'PMO Team', progress: 74, status: 'Active' },
    { name: 'Staff ID', lead: 'Admin Desk', progress: 68, status: 'Processing' },
  ]

  return (
    <div className="neo-dashboard">
      <section className="neo-hero card">
        <div>
          <div className="neo-breadcrumbs">Home • Dashboard • Analytics</div>
          <h1>SPA Dashboard Analytics</h1>
          <p>Redesigned dashboard with your existing SPA options only, aligned for cleaner viewing and better spacing.</p>
        </div>
        <div className="tabs neo-tabs">
          {['Today', 'This Week', 'This Month', 'This Year'].map((item) => (
            <button key={item} className={`tab ${period === item ? 'active' : ''}`} onClick={() => setPeriod(item)}>
              {item}
            </button>
          ))}
        </div>
      </section>

      <div className="neo-top-grid">
        <div className="neo-stats-grid">
          <StatCard title="Total Staff" value={totalStaff} change={`${availableStaff} available now`} icon="👥" tone="cyan" />
          <StatCard title="Active Projects" value={activeProjects} change={`${pendingProjects} pending review`} icon="📁" tone="yellow" />
          <StatCard title="Completed Projects" value={completedProjects} change={`${projStats.avgCompletion || 52}% avg completion`} icon="✅" tone="green" />
          <StatCard title="Staff On Leave" value={onLeave} change={`${busyStaff} currently busy`} icon="🗓️" tone="pink" />
        </div>

        <div className="neo-activity-card card">
          <div className="neo-section-header">
            <div>
              <div className="card-title">Project Activity</div>
              <div className="card-subtitle">Based on your project status modules</div>
            </div>
          </div>

          <div className="neo-ring-wrap">
            <div className="neo-ring" style={{ background: `conic-gradient(${activitySegments})` }}>
              <div className="neo-ring-center">
                <strong>{projStats.total || activeProjects + pendingProjects + completedProjects + reviewProjects}</strong>
                <span>Total Activity</span>
              </div>
            </div>

            <div className="neo-ring-legend">
              {[
                ['Active', activeProjects, ACTIVITY_COLORS[0]],
                ['Pending', pendingProjects, ACTIVITY_COLORS[1]],
                ['Completed', completedProjects, ACTIVITY_COLORS[2]],
                ['Review', reviewProjects, ACTIVITY_COLORS[3]],
              ].map(([label, value, color]) => (
                <div key={label} className="neo-legend-row">
                  <span className="neo-dot" style={{ background: color }}></span>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="neo-middle-grid">
        <div className="neo-chart-card card">
          <div className="neo-section-header">
            <div>
              <div className="card-title">Staff & Project Performance</div>
              <div className="card-subtitle">Visual alignment inspired by your reference image</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')}>Open Project Status</button>
          </div>

          <div className="neo-chart-area">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="staffFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#33d1ff" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#33d1ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="projectFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c5cff" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#7c5cff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fill: '#7f86a8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#7f86a8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="staff" name="Staff" stroke="#33d1ff" strokeWidth={3} fill="url(#staffFill)" />
                <Area type="monotone" dataKey="projects" name="Projects" stroke="#7c5cff" strokeWidth={3} fill="url(#projectFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="neo-team-card card">
          <div className="neo-section-header">
            <div>
              <div className="card-title">Team Availability</div>
              <div className="card-subtitle">From staff profiles and attendance status</div>
            </div>
          </div>

          <div className="neo-team-list">
            {teamRows.map((item) => (
              <div key={item.name} className="neo-team-row">
                <div className="neo-team-row-head">
                  <span>{item.name}</span>
                  <strong>{item.value} ({item.percent}%)</strong>
                </div>
                <div className="neo-progress-shell">
                  <div className="neo-progress-fill" style={{ width: `${item.percent}%`, background: item.color }}></div>
                </div>
              </div>
            ))}
          </div>

          <button className="btn btn-primary" onClick={() => navigate('/staff')}>Open Staff Profiles</button>
        </div>
      </div>

      <div className="neo-bottom-grid">
        <div className="neo-table-card card">
          <div className="neo-section-header">
            <div>
              <div className="card-title">Dashboard Module Progress</div>
              <div className="card-subtitle">Only your existing website modules are shown here</div>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="table neo-table">
              <thead>
                <tr>
                  <th>Module</th>
                  <th>Lead</th>
                  <th>Progress</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {projectRows.map((row) => (
                  <tr key={row.name} onClick={() => navigate(row.name === 'Staff Profiles' ? '/staff' : row.name === 'AI Allocation' ? '/allocation' : row.name === 'Staff ID' ? '/staff-id' : '/projects')}>
                    <td>{row.name}</td>
                    <td>{row.lead}</td>
                    <td>
                      <div className="neo-inline-progress">
                        <div className="neo-progress-shell">
                          <div className="neo-progress-fill" style={{ width: `${row.progress}%` }}></div>
                        </div>
                        <span>{row.progress}%</span>
                      </div>
                    </td>
                    <td><span className="badge badge-info">{row.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="neo-activity-feed card">
          <div className="neo-section-header">
            <div>
              <div className="card-title">Recent Updates</div>
              <div className="card-subtitle">Quick dashboard feed</div>
            </div>
          </div>

          <div className="neo-feed-list">
            {recentFallback.map((item) => (
              <div key={item.id} className="neo-feed-item">
                <div className="neo-feed-icon">•</div>
                <div>
                  <div className="neo-feed-title">{item.title}</div>
                  <div className="neo-feed-meta">{item.owner} • {item.amount}</div>
                </div>
                <span>{item.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
