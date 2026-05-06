import { useState, useEffect } from 'react'
import { projectAPI } from '../utils/api'

/* ────────────────────────────────────────────────────────────────────────── */
/* CONSTANTS                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

const AVATAR_COLORS = [
  '#7c5cff', '#38bdf8', '#22c55e', '#f59e0b',
  '#ef4d6a', '#a855f7', '#3a86ff', '#06d6a0',
]

const STATUS_CONFIG = {
  'In Progress': { color:'#4cc9f0', bg:'rgba(76,201,240,0.15)',  border:'rgba(76,201,240,0.30)',  icon:'🔄' },
  'Completed':   { color:'#00c896', bg:'rgba(0,200,150,0.15)',   border:'rgba(0,200,150,0.30)',   icon:'✅' },
  'On Hold':     { color:'#ff9f43', bg:'rgba(255,159,67,0.15)',  border:'rgba(255,159,67,0.30)',  icon:'⏸️' },
  'Review':      { color:'#ffd166', bg:'rgba(255,209,102,0.15)', border:'rgba(255,209,102,0.30)', icon:'👁️' },
  'Planning':    { color:'#8B5CF6', bg:'rgba(139,92,246,0.15)',  border:'rgba(139,92,246,0.30)',  icon:'📋' },
}

const PRIORITY_CONFIG = {
  'Critical': { color:'#ef4d6a', bg:'rgba(239,77,106,0.15)',  border:'rgba(239,77,106,0.30)' },
  'High':     { color:'#ff9f43', bg:'rgba(255,159,67,0.15)',  border:'rgba(255,159,67,0.30)' },
  'Medium':   { color:'#4cc9f0', bg:'rgba(76,201,240,0.15)',  border:'rgba(76,201,240,0.30)' },
  'Low':      { color:'#00c896', bg:'rgba(0,200,150,0.15)',   border:'rgba(0,200,150,0.30)'  },
}

const INITIAL_PROJECTS = [
  {
    id: 1, name: 'SPA Mobile App', icon: '📱', color: '#7c5cff',
    status: 'In Progress', priority: 'High', progress: 78,
    startDate: '2024-01-15', endDate: '2024-06-30', budget: '₹12,00,000',
    head: { name: 'Arjun Singh', role: 'Senior Developer', color: 0 },
    team: [
      { name: 'Priya Sharma', role: 'UI/UX Designer', color: 1 },
      { name: 'Ravi Kumar',   role: 'DevOps',         color: 4 },
    ],
    description: 'A complete mobile application for SPA clients featuring real-time project tracking, team collaboration, and AI-powered insights.',
    tech: ['React Native', 'Node.js', 'MongoDB', 'AWS'],
    tasks: [
      { name: 'UI Design Completion', done: true  },
      { name: 'API Integration',      done: true  },
      { name: 'Beta Testing',         done: false },
    ],
    milestones: [
      { name: 'Design Phase',  date: '2024-02-15', done: true  },
      { name: 'Testing Phase', date: '2024-06-01', done: false },
    ],
  },
]

/* ────────────────────────────────────────────────────────────────────────── */
/* SMALL PRESENTATIONAL COMPONENTS                                            */
/* ────────────────────────────────────────────────────────────────────────── */

function StatusBadge({ status }) {
  const s = STATUS_CONFIG[status] || STATUS_CONFIG['Planning']
  return (
    <span style={{
      padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:700,
      background:s.bg, color:s.color, border:`1px solid ${s.border}`,
      display:'inline-flex', alignItems:'center', gap:4, whiteSpace:'nowrap',
    }}>
      {s.icon} {status}
    </span>
  )
}

function PriorityBadge({ priority }) {
  const p = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG['Medium']
  return (
    <span style={{
      padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:700,
      background:p.bg, color:p.color, border:`1px solid ${p.border}`,
      display:'inline-flex', alignItems:'center', gap:4, whiteSpace:'nowrap',
    }}>
      🚦 {priority}
    </span>
  )
}

function StatCard({ label, value, icon, color, active, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: active ? `${color}18` : 'var(--panel)',
      border: `2px solid ${active ? color : 'var(--panel-border)'}`,
      borderRadius:16, padding:'20px 22px', cursor:'pointer',
      transition:'all 0.2s', display:'flex', flexDirection:'column', gap:6,
      boxShadow: active ? `0 4px 20px ${color}25` : 'none',
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div style={{
          fontSize:12, fontWeight:700,
          color: active ? color : 'var(--text-muted)',
          textTransform:'uppercase', letterSpacing:'0.08em',
        }}>{label}</div>
        <div style={{
          width:38, height:38, borderRadius:10, background:`${color}18`,
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:18,
        }}>{icon}</div>
      </div>
      <div style={{ fontSize:32, fontWeight:900, color, letterSpacing:'-1px' }}>{value}</div>
      <div style={{ fontSize:11, color:'var(--text-muted)' }}>
        {active ? 'Click to show all' : 'Click to filter'}
      </div>
    </div>
  )
}

function MemberStack({ head, team, max = 4 }) {
  const all = [head, ...team].filter(Boolean)
  const shown = all.slice(0, max)
  const extra = all.length - shown.length
  return (
    <div style={{ display:'flex', alignItems:'center' }}>
      {shown.map((m, i) => (
        <div
          key={i}
          title={`${m?.name || '?'}${m?.role ? ' — ' + m.role : ''}`}
          style={{
            width:30, height:30, borderRadius:'50%',
            background: AVATAR_COLORS[m?.color ?? (i % 8)],
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:11, fontWeight:800, color:'#fff',
            marginLeft: i === 0 ? 0 : -8,
            border:'2px solid var(--panel)',
            zIndex: shown.length - i,
          }}
        >
          {(m?.name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
        </div>
      ))}
      {extra > 0 && (
        <div style={{
          width:30, height:30, borderRadius:'50%', marginLeft:-8,
          background:'var(--bg3)', border:'2px solid var(--panel)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:10, fontWeight:700, color:'var(--text-muted)',
        }}>+{extra}</div>
      )}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/* MODALS                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

const MODAL_OVERLAY = {
  position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:2000,
  display:'flex', alignItems:'center', justifyContent:'center', padding:24,
}
const MODAL_BODY = {
  background:'var(--panel)', border:'1px solid var(--panel-border)',
  borderRadius:20, width:'100%', maxHeight:'92vh', overflowY:'auto',
}

/* ── Edit Project ─────────────────────────────────────────────────────────── */
function EditProjectModal({ project, onClose, onSave }) {
  const [form, setForm] = useState({
    budget:      project.budget      || '',
    description: project.description || '',
    startDate:   project.startDate   || '',
    endDate:     project.endDate     || '',
    status:      project.status      || 'Planning',
    priority:    project.priority    || 'Medium',
    progress:    project.progress    ?? 0,
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div style={MODAL_OVERLAY} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...MODAL_BODY, maxWidth:620, padding:32 }}>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h2 style={{ margin:0, fontSize:20, fontWeight:800 }}>✏️ Edit Project</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:22 }}>✕</button>
        </div>

        <div style={{
          background:'rgba(76,201,240,0.06)', border:'1px solid rgba(76,201,240,0.15)',
          borderRadius:10, padding:'10px 14px', marginBottom:20, fontSize:12, color:'#4cc9f0',
        }}>
          ℹ️ Only budget, description, dates, status, priority and progress are editable. Author &amp; team details are preserved automatically.
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
          <Field label="📊 Status">
            <select className="form-control" value={form.status} onChange={e=>set('status',e.target.value)}>
              {Object.keys(STATUS_CONFIG).map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="🚦 Priority">
            <select className="form-control" value={form.priority} onChange={e=>set('priority',e.target.value)}>
              {Object.keys(PRIORITY_CONFIG).map(p => <option key={p}>{p}</option>)}
            </select>
          </Field>
        </div>

        <Field label="💰 Budget">
          <input className="form-control" value={form.budget}
            onChange={e=>set('budget',e.target.value)} placeholder="e.g. ₹10,00,000"/>
        </Field>

        <Field label={`📈 Progress: ${form.progress}%`}>
          <input className="form-control" type="range" min="0" max="100"
            value={form.progress} onChange={e=>set('progress',Number(e.target.value))}/>
        </Field>

        <Field label="📝 Description">
          <textarea className="form-control" rows={4} value={form.description}
            onChange={e=>set('description',e.target.value)} placeholder="Project description..."/>
        </Field>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <Field label="📅 Start Date">
            <input className="form-control" type="date" value={form.startDate} onChange={e=>set('startDate',e.target.value)}/>
          </Field>
          <Field label="🏁 End Date">
            <input className="form-control" type="date" value={form.endDate} onChange={e=>set('endDate',e.target.value)}/>
          </Field>
        </div>

        <div style={{ display:'flex', gap:10, marginTop:24 }}>
          <button onClick={onClose} style={{
            flex:1, padding:'12px', borderRadius:12, border:'1px solid var(--panel-border)',
            background:'none', color:'var(--text-muted)', cursor:'pointer', fontWeight:600,
          }}>Cancel</button>
          <button disabled={saving} onClick={handleSave} style={{
            flex:2, padding:'12px', borderRadius:12, background:'var(--primary, #8B5CF6)',
            border:'none', color:'#fff', cursor:'pointer', fontWeight:700, fontSize:14,
            opacity: saving ? 0.6 : 1,
          }}>{saving ? '⏳ Saving…' : '💾 Save Changes'}</button>
        </div>
      </div>
    </div>
  )
}

/* ── New Project ──────────────────────────────────────────────────────────── */
function NewProjectModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    name:'', icon:'📁', color:'#7c5cff', status:'Planning', priority:'Medium',
    budget:'', description:'', startDate:'', endDate:'',
    headName:'', headRole:'',
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const ICONS  = ['📁','📱','☁️','🤖','🔒','🛒','👔','🚀','💡','🌐','🔧','📊']
  const COLORS = ['#7c5cff','#38bdf8','#22c55e','#f59e0b','#ef4d6a','#a855f7','#3a86ff','#06d6a0']

  const handleSave = async () => {
    if (!form.name.trim()) { alert('Project name is required'); return }
    setSaving(true)
    await onSave({
      ...form,
      head: { name: form.headName || 'TBD', role: form.headRole || 'Lead', color: 0 },
      team: [], tasks: [], milestones: [], tech: [], progress: 0,
    })
    setSaving(false)
  }

  return (
    <div style={MODAL_OVERLAY} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...MODAL_BODY, maxWidth:680, padding:32 }}>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h2 style={{ margin:0, fontSize:20, fontWeight:800 }}>➕ Create New Project</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:22 }}>✕</button>
        </div>

        <div style={{ display:'flex', gap:24, marginBottom:20, flexWrap:'wrap' }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.08em' }}>Icon</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, width:200 }}>
              {ICONS.map(ic => (
                <button key={ic} type="button" onClick={()=>set('icon',ic)} style={{
                  width:34, height:34, fontSize:18, borderRadius:8,
                  border:`2px solid ${form.icon===ic?'#8B5CF6':'var(--panel-border)'}`,
                  background:'var(--bg3)', cursor:'pointer',
                }}>{ic}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.08em' }}>Color</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {COLORS.map(c => (
                <div key={c} onClick={()=>set('color',c)} style={{
                  width:26, height:26, borderRadius:'50%', background:c, cursor:'pointer',
                  border: form.color===c ? '3px solid #fff' : '3px solid transparent',
                }}/>
              ))}
            </div>
          </div>
        </div>

        <Field label="Project Name *">
          <input className="form-control" value={form.name}
            onChange={e=>set('name',e.target.value)} placeholder="e.g. SPA Mobile App"/>
        </Field>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <Field label="Status">
            <select className="form-control" value={form.status} onChange={e=>set('status',e.target.value)}>
              {Object.keys(STATUS_CONFIG).map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Priority">
            <select className="form-control" value={form.priority} onChange={e=>set('priority',e.target.value)}>
              {Object.keys(PRIORITY_CONFIG).map(p => <option key={p}>{p}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Budget">
          <input className="form-control" value={form.budget}
            onChange={e=>set('budget',e.target.value)} placeholder="e.g. ₹10,00,000"/>
        </Field>

        <Field label="Description">
          <textarea className="form-control" rows={3} value={form.description}
            onChange={e=>set('description',e.target.value)} placeholder="Project overview..."/>
        </Field>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <Field label="Start Date">
            <input className="form-control" type="date" value={form.startDate} onChange={e=>set('startDate',e.target.value)}/>
          </Field>
          <Field label="End Date">
            <input className="form-control" type="date" value={form.endDate} onChange={e=>set('endDate',e.target.value)}/>
          </Field>
        </div>

        <div style={{ fontSize:11, fontWeight:800, color:'#8B5CF6', marginBottom:10, marginTop:6, textTransform:'uppercase', letterSpacing:'0.1em' }}>
          Project Head
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <Field label="Head Name">
            <input className="form-control" value={form.headName}
              onChange={e=>set('headName',e.target.value)} placeholder="e.g. John Doe"/>
          </Field>
          <Field label="Head Role">
            <input className="form-control" value={form.headRole}
              onChange={e=>set('headRole',e.target.value)} placeholder="e.g. Tech Lead"/>
          </Field>
        </div>

        <div style={{ display:'flex', gap:10, marginTop:22 }}>
          <button onClick={onClose} style={{
            flex:1, padding:'12px', borderRadius:12, border:'1px solid var(--panel-border)',
            background:'none', color:'var(--text-muted)', cursor:'pointer', fontWeight:600,
          }}>Cancel</button>
          <button disabled={saving} onClick={handleSave} style={{
            flex:2, padding:'12px', borderRadius:12, background:'#00c896',
            border:'none', color:'#fff', cursor:'pointer', fontWeight:700, fontSize:14,
            opacity: saving ? 0.6 : 1,
          }}>{saving ? '⏳ Creating…' : '✅ Create Project'}</button>
        </div>
      </div>
    </div>
  )
}

/* ── Delete confirmation ──────────────────────────────────────────────────── */
function DeleteModal({ project, onConfirm, onClose }) {
  const [deleting, setDeleting] = useState(false)
  return (
    <div style={MODAL_OVERLAY} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...MODAL_BODY, maxWidth:460, padding:32 }}>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <h3 style={{ margin:0, fontSize:18, fontWeight:800, color:'#ef4d6a' }}>🗑️ Delete Project</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:22 }}>✕</button>
        </div>

        <div style={{ textAlign:'center', padding:'10px 0 20px' }}>
          <div style={{ fontSize:52, marginBottom:12 }}>{project.icon}</div>
          <div style={{ fontSize:16, fontWeight:700, marginBottom:8 }}>{project.name}</div>
          <div style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.6 }}>
            Are you sure you want to delete this project?<br/>
            <strong style={{ color:'#ef4d6a' }}>This action cannot be undone.</strong>
          </div>
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{
            flex:1, padding:'12px', borderRadius:12, border:'1px solid var(--panel-border)',
            background:'none', color:'var(--text-muted)', cursor:'pointer', fontWeight:600,
          }}>Cancel</button>
          <button disabled={deleting}
            onClick={async () => { setDeleting(true); await onConfirm() }}
            style={{
              flex:1, padding:'12px', borderRadius:12, background:'#ef4d6a',
              border:'none', color:'#fff', cursor:'pointer', fontWeight:700, fontSize:14,
              opacity: deleting ? 0.6 : 1,
            }}>
            {deleting ? '⏳ Deleting…' : '🗑️ Confirm Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Project Detail (with tabs) ───────────────────────────────────────────── */
function ProjectDetailModal({ project, onClose, onEdit, onDelete }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [analysis, setAnalysis] = useState(project.allocationSnapshot || null)
  const [analysisLoading, setAnalysisLoading] = useState(false)

  const sc = STATUS_CONFIG[project.status] || STATUS_CONFIG['Planning']
  const doneTasks = project.tasks.filter(t => t.done).length

  useEffect(() => {
    let mounted = true
    if (!analysis && project.id) {
      setAnalysisLoading(true)
      projectAPI.getAnalysis(project.id)
        .then(data => { if (mounted) setAnalysis(data) })
        .catch(() => {})
        .finally(() => { if (mounted) setAnalysisLoading(false) })
    }
    return () => { mounted = false }
  }, [project.id])

  const TABS = ['overview', 'team', 'tasks', 'milestones', 'ai analysis']

  return (
    <div style={MODAL_OVERLAY} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...MODAL_BODY, maxWidth:860, padding:32 }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20, gap:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14, minWidth:0 }}>
            <div style={{
              width:52, height:52, borderRadius:14, background:`${project.color}22`,
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0,
            }}>{project.icon}</div>
            <div style={{ minWidth:0 }}>
              <h2 style={{ margin:0, fontSize:20, fontWeight:800 }}>{project.name}</h2>
              <div style={{ display:'flex', gap:6, marginTop:6, flexWrap:'wrap' }}>
                <StatusBadge status={project.status}/>
                <PriorityBadge priority={project.priority}/>
              </div>
            </div>
          </div>
          <div style={{ display:'flex', gap:6, flexShrink:0 }}>
            <button onClick={onEdit} style={{
              padding:'7px 12px', fontSize:12, fontWeight:600, borderRadius:9,
              border:'1px solid var(--panel-border)', background:'var(--bg3)',
              color:'var(--text-soft)', cursor:'pointer',
            }}>✏️ Edit</button>
            <button onClick={onDelete} style={{
              padding:'7px 12px', fontSize:12, fontWeight:600, borderRadius:9,
              border:'1px solid rgba(239,77,106,0.3)', background:'rgba(239,77,106,0.12)',
              color:'#ef4d6a', cursor:'pointer',
            }}>🗑️ Delete</button>
            <button onClick={onClose} style={{
              background:'none', border:'none', color:'var(--text-muted)',
              cursor:'pointer', fontSize:22, padding:'0 6px',
            }}>✕</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display:'flex', gap:4, marginBottom:22, padding:4,
          background:'var(--bg3)', borderRadius:12, border:'1px solid var(--panel-border)',
          overflowX:'auto',
        }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              flex:1, minWidth:'fit-content', padding:'9px 14px', fontSize:12, fontWeight:700,
              borderRadius:9, border:'none', cursor:'pointer', textTransform:'capitalize',
              background: activeTab === t ? 'var(--panel)' : 'transparent',
              color: activeTab === t ? sc.color : 'var(--text-muted)',
              boxShadow: activeTab === t ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
              transition:'all 0.15s', whiteSpace:'nowrap',
            }}>{t}</button>
          ))}
        </div>

        {/* Tab content ----------------------------------------------------- */}

        {activeTab === 'overview' && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:22 }}>
              {[
                { label:'Progress',   value:`${project.progress}%`,                       icon:'📊', color:project.color },
                { label:'Budget',     value:project.budget || '—',                        icon:'💰', color:'#00c896' },
                { label:'Tasks Done', value:`${doneTasks}/${project.tasks.length}`,        icon:'✅', color:'#4cc9f0' },
                { label:'Team Size',  value:`${project.team.length + 1}`,                  icon:'👥', color:'#8B5CF6' },
              ].map(s => (
                <div key={s.label} style={{
                  background:'var(--bg3)', borderRadius:12, padding:14,
                  border:'1px solid var(--panel-border)',
                }}>
                  <div style={{ fontSize:18, marginBottom:6 }}>{s.icon}</div>
                  <div style={{ fontSize:20, fontWeight:800, color:s.color, lineHeight:1.1 }}>{s.value}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:13 }}>
                <span style={{ fontWeight:600 }}>Overall Progress</span>
                <span style={{ color:project.color, fontWeight:700 }}>{project.progress}%</span>
              </div>
              <div style={{ height:10, background:'var(--bg3)', borderRadius:5, overflow:'hidden', border:'1px solid var(--panel-border)' }}>
                <div style={{
                  height:'100%', width:`${project.progress}%`,
                  background:`linear-gradient(90deg, ${project.color}, ${project.color}99)`,
                  transition:'width 0.6s',
                }}/>
              </div>
            </div>

            <SectionTitle>Project Description</SectionTitle>
            <div style={{
              fontSize:13.5, color:'var(--text-soft)', lineHeight:1.7,
              background:'var(--bg3)', padding:14, borderRadius:10,
              border:'1px solid var(--panel-border)', marginBottom:20,
            }}>{project.description || '—'}</div>

            {!!project.aiSummary && (
              <>
                <SectionTitle color="#a78bfa">AI Summary</SectionTitle>
                <div style={{
                  fontSize:13.5, color:'var(--text-soft)', lineHeight:1.7,
                  background:'rgba(124,92,255,0.08)', padding:14, borderRadius:10,
                  border:'1px solid rgba(124,92,255,0.18)', marginBottom:20,
                }}>{project.aiSummary}</div>
              </>
            )}

            {project.tech.length > 0 && (
              <>
                <SectionTitle>Tech Stack</SectionTitle>
                <div style={{ display:'flex', flexWrap:'wrap', gap:7, marginBottom:20 }}>
                  {project.tech.map(t => (
                    <span key={t} style={{
                      padding:'4px 11px', borderRadius:20, fontSize:12, fontWeight:600,
                      background:'rgba(139,92,246,0.15)', color:'#8B5CF6',
                      border:'1px solid rgba(139,92,246,0.30)',
                    }}>⚙️ {t}</span>
                  ))}
                </div>
              </>
            )}

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <KeyValue label="📅 Start Date" value={project.startDate || '—'}/>
              <KeyValue label="🏁 End Date"   value={project.endDate   || '—'}/>
            </div>
          </div>
        )}

        {activeTab === 'team' && (
          <div>
            <SectionTitle color="#8B5CF6">Project Head</SectionTitle>
            <div style={{
              background:'linear-gradient(135deg, rgba(139,92,246,0.10), rgba(139,92,246,0.03))',
              border:'1px solid rgba(139,92,246,0.25)', borderRadius:12,
              padding:18, display:'flex', alignItems:'center', gap:14, marginBottom:24,
            }}>
              <div style={{
                width:54, height:54, borderRadius:14,
                background: AVATAR_COLORS[project.head?.color ?? 0],
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:20, fontWeight:800, color:'#fff',
              }}>
                {(project.head?.name || 'TBD').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div>
                <div style={{ fontSize:16, fontWeight:800 }}>{project.head?.name || 'TBD'}</div>
                <div style={{ fontSize:13, color:'#8B5CF6' }}>{project.head?.role || ''}</div>
                <span style={{
                  display:'inline-block', marginTop:6, padding:'3px 10px', borderRadius:20,
                  fontSize:10, fontWeight:700,
                  background:'rgba(239,77,106,0.15)', color:'#ef4d6a',
                  border:'1px solid rgba(239,77,106,0.25)',
                }}>👑 PROJECT HEAD</span>
              </div>
            </div>

            <SectionTitle>Team Members ({project.team.length})</SectionTitle>
            {project.team.length === 0 ? (
              <div style={{ color:'var(--text-muted)', fontSize:13, padding:20, textAlign:'center' }}>
                No team members assigned yet.
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {project.team.map((m, i) => (
                  <div key={i} style={{
                    background:'var(--bg3)', borderRadius:12, padding:14,
                    display:'flex', alignItems:'center', gap:12,
                    border:'1px solid var(--panel-border)',
                  }}>
                    <div style={{
                      width:42, height:42, borderRadius:12,
                      background: AVATAR_COLORS[m.color ?? (i % 8)],
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:14, fontWeight:800, color:'#fff', flexShrink:0,
                    }}>
                      {m.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontWeight:700, fontSize:14 }}>{m.name}</div>
                      <div style={{ fontSize:12, color:'var(--text-muted)' }}>{m.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div>
            <div style={{ marginBottom:14, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em' }}>
                Task Completion
              </div>
              <span style={{
                padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:700,
                background:'rgba(76,201,240,0.15)', color:'#4cc9f0',
                border:'1px solid rgba(76,201,240,0.30)',
              }}>{doneTasks}/{project.tasks.length} Done</span>
            </div>
            {project.tasks.length === 0 ? (
              <div style={{ color:'var(--text-muted)', fontSize:13, padding:20, textAlign:'center' }}>
                No tasks defined.
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {project.tasks.map((t, i) => (
                  <div key={i} style={{
                    display:'flex', alignItems:'center', gap:14,
                    padding:'13px 16px',
                    background: t.done ? 'rgba(0,200,150,0.06)' : 'var(--bg3)',
                    borderRadius:10,
                    border:`1px solid ${t.done ? 'rgba(0,200,150,0.20)' : 'var(--panel-border)'}`,
                  }}>
                    <div style={{
                      width:22, height:22, borderRadius:'50%', flexShrink:0,
                      background: t.done ? '#00c896' : 'rgba(255,255,255,0.06)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:11, fontWeight:700, color:'#fff',
                    }}>{t.done ? '✓' : i + 1}</div>
                    <div style={{
                      flex:1, fontSize:13, fontWeight:500,
                      color: t.done ? 'var(--text-muted)' : 'var(--text)',
                      textDecoration: t.done ? 'line-through' : 'none',
                    }}>{t.name}</div>
                    <span style={{
                      padding:'3px 10px', borderRadius:20, fontSize:10, fontWeight:700,
                      background: t.done ? 'rgba(0,200,150,0.15)' : 'rgba(255,159,67,0.15)',
                      color:     t.done ? '#00c896'              : '#ff9f43',
                    }}>{t.done ? '✅ Done' : '⏳ Pending'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'milestones' && (
          <div>
            {project.milestones.length === 0 ? (
              <div style={{ color:'var(--text-muted)', fontSize:13, padding:20, textAlign:'center' }}>
                No milestones defined.
              </div>
            ) : (
              <div style={{ position:'relative', paddingLeft:28 }}>
                <div style={{ position:'absolute', left:11, top:0, bottom:0, width:2, background:'var(--panel-border)' }}/>
                {project.milestones.map((m, i) => (
                  <div key={i} style={{ position:'relative', marginBottom:18 }}>
                    <div style={{
                      position:'absolute', left:-22, top:6,
                      width:14, height:14, borderRadius:'50%',
                      background: m.done ? '#00c896' : 'var(--panel-border)',
                      border:'2px solid var(--panel)', zIndex:1,
                    }}/>
                    <div style={{
                      background:'var(--bg3)', borderRadius:10, padding:'12px 16px',
                      border:`1px solid ${m.done ? 'rgba(0,200,150,0.20)' : 'var(--panel-border)'}`,
                    }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 }}>
                        <div style={{ fontWeight:600, fontSize:14 }}>{m.name}</div>
                        <span style={{
                          padding:'3px 10px', borderRadius:20, fontSize:10, fontWeight:700,
                          background: m.done ? 'rgba(0,200,150,0.15)' : 'rgba(255,159,67,0.15)',
                          color:     m.done ? '#00c896'               : '#ff9f43',
                        }}>{m.done ? '✅ Completed' : '⏳ Upcoming'}</span>
                      </div>
                      <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:4 }}>📅 {m.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'ai analysis' && (
          <div>
            {analysisLoading && (
              <div style={{ padding:'40px 0', textAlign:'center', color:'var(--text-muted)' }}>
                <div style={{ fontSize:36, marginBottom:12 }}>⏳</div>
                <div>Analyzing project allocation…</div>
              </div>
            )}
            {!analysisLoading && analysis && (
              <div style={{
                background:'rgba(124,92,255,0.08)', border:'1px solid rgba(124,92,255,0.18)',
                borderRadius:12, padding:18,
              }}>
                <div style={{ fontWeight:700, color:'#a78bfa', marginBottom:10 }}>
                  🤖 Allocation Summary
                </div>
                <div style={{ lineHeight:1.7, color:'var(--text-soft)', fontSize:13.5 }}>
                  {analysis.analysis?.summary || 'No AI summary available.'}
                </div>
              </div>
            )}
            {!analysisLoading && !analysis && (
              <div style={{ padding:'50px 20px', textAlign:'center', color:'var(--text-muted)' }}>
                <div style={{ fontSize:42, marginBottom:12 }}>🤖</div>
                <div style={{ fontSize:14, fontWeight:600 }}>No AI analysis available</div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

/* Tiny presentational helpers used by modals */
function Field({ label, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{
        display:'block', fontSize:12, fontWeight:700,
        color:'var(--text-muted)', marginBottom:6,
        textTransform:'uppercase', letterSpacing:'0.06em',
      }}>{label}</label>
      {children}
    </div>
  )
}
function SectionTitle({ children, color }) {
  return (
    <div style={{
      fontSize:12, fontWeight:800, marginBottom:10,
      color: color || 'var(--text-muted)',
      textTransform:'uppercase', letterSpacing:'0.10em',
    }}>{children}</div>
  )
}
function KeyValue({ label, value }) {
  return (
    <div style={{
      background:'var(--bg3)', borderRadius:10, padding:'12px 14px',
      border:'1px solid var(--panel-border)',
    }}>
      <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:13, fontWeight:600 }}>{value}</div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/* HELPERS                                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

function normalizeProj(p) {
  const statusMap = { Active:'In Progress', Pending:'Planning', Review:'Review', Completed:'Completed' }
  return {
    ...p,
    status:    statusMap[p.status] || p.status || 'Planning',
    icon:      p.icon  || '📁',
    color:     p.color || '#7c5cff',
    progress:  p.completion ?? p.progress ?? 0,
    endDate:   p.deadline || p.endDate || '',
    head:      p.head ? (typeof p.head === 'string' ? { name:p.head, role:'Lead', color:0 } : p.head) : { name:'TBD', role:'', color:0 },
    team:      Array.isArray(p.team) ? p.team : [],
    aiSummary: p.aiSummary || '',
    riskLevel: p.riskLevel || 'Medium',
    allocationSnapshot: p.allocationSnapshot || null,
    tasks:      Array.isArray(p.tasks)      ? p.tasks      : [],
    milestones: Array.isArray(p.milestones) ? p.milestones : [],
    tech:       Array.isArray(p.tech)       ? p.tech       : [],
  }
}

const formatDate = (d) => {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
  } catch { return d }
}

/* ────────────────────────────────────────────────────────────────────────── */
/* MAIN PAGE                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

export default function ProjectStatus() {
  const [projects, setProjects] = useState(INITIAL_PROJECTS)
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState(null)
  const [editing,  setEditing]  = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [showNew,  setShowNew]  = useState(false)
  const [filter,   setFilter]   = useState('All')
  const [search,   setSearch]   = useState('')
  const [toast,    setToast]    = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const load = async () => {
    setLoading(true)
    try {
      const data = await projectAPI.getAll()
      setProjects(data.map(normalizeProj))
    } catch {
      /* keep INITIAL_PROJECTS as fallback */
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = projects.filter(p => {
    const matchFilter = filter === 'All' || p.status === filter
    const q = search.toLowerCase()
    const matchSearch = !q
      || p.name?.toLowerCase().includes(q)
      || p.description?.toLowerCase().includes(q)
      || p.head?.name?.toLowerCase().includes(q)
    return matchFilter && matchSearch
  })

  const stats = {
    total:      projects.length,
    inProgress: projects.filter(p => p.status === 'In Progress').length,
    completed:  projects.filter(p => p.status === 'Completed').length,
    onHold:     projects.filter(p => p.status === 'On Hold').length,
  }

  const STAT_CARDS = [
    { key:'All',         label:'Total',       value:stats.total,      icon:'📋', color:'#8B5CF6' },
    { key:'In Progress', label:'In Progress', value:stats.inProgress, icon:'🔄', color:'#4cc9f0' },
    { key:'Completed',   label:'Completed',   value:stats.completed,  icon:'✅', color:'#00c896' },
    { key:'On Hold',     label:'On Hold',     value:stats.onHold,     icon:'⏸️', color:'#ff9f43' },
  ]

  /* ── Handlers ─────────────────────────────────────────────────────────── */

  const handleEditSave = async (form) => {
    try {
      const existing = projects.find(p => p.id === editing.id) || editing
      const payload = {
        ...existing,
        budget:      form.budget,
        description: form.description,
        startDate:   form.startDate,
        endDate:     form.endDate,
        status:      form.status,
        priority:    form.priority,
        progress:    Number(form.progress),
        completion:  Number(form.progress),
        head: existing.head,   // preserve original
        team: existing.team,   // preserve original
      }
      let norm
      try {
        const updated = await projectAPI.update(editing.id, payload)
        norm = normalizeProj(updated)
      } catch {
        norm = normalizeProj(payload)
      }
      setProjects(ps => ps.map(p => p.id === editing.id ? norm : p))
      if (selected?.id === editing.id) setSelected(norm)
      setEditing(null)
      showToast('Project updated successfully!')
    } catch (err) {
      showToast('Failed to update: ' + err.message, 'error')
    }
  }

  const handleNewProject = async (form) => {
    try {
      let created
      try { created = await projectAPI.create(form) }
      catch { created = { ...form, id: Date.now() } }
      setProjects(ps => [...ps, normalizeProj(created)])
      setShowNew(false)
      showToast('Project created!')
    } catch (err) {
      showToast('Failed to create: ' + err.message, 'error')
    }
  }

  const handleDelete = async (project) => {
    try {
      try { await projectAPI.remove(project.id) } catch {}
      setProjects(ps => ps.filter(p => p.id !== project.id))
      setDeleting(null)
      setSelected(null)
      showToast(`"${project.name}" deleted.`)
    } catch (err) {
      showToast('Failed to delete: ' + err.message, 'error')
    }
  }

  /* ── Render ───────────────────────────────────────────────────────────── */

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position:'fixed', top:24, right:24, zIndex:9999,
          padding:'13px 20px', borderRadius:13, fontWeight:600, fontSize:14,
          background: toast.type === 'error' ? '#ef4d6a' : '#00c896', color:'#fff',
          boxShadow:'0 8px 32px rgba(0,0,0,0.35)', animation:'_toastIn 0.3s ease',
        }}>
          {toast.type === 'error' ? '⚠️' : '✅'} {toast.msg}
        </div>
      )}

      {/* Modals */}
      {selected && !editing && !deleting && (
        <ProjectDetailModal
          project={selected}
          onClose={() => setSelected(null)}
          onEdit={() => { setEditing(selected); setSelected(null) }}
          onDelete={() => { setDeleting(selected); setSelected(null) }}
        />
      )}
      {editing  && <EditProjectModal project={editing}  onClose={() => setEditing(null)}  onSave={handleEditSave}/>}
      {deleting && <DeleteModal     project={deleting} onClose={() => setDeleting(null)} onConfirm={() => handleDelete(deleting)}/>}
      {showNew  && <NewProjectModal                    onClose={() => setShowNew(false)} onSave={handleNewProject}/>}

      {/* Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Projects 📊</h1>
            <p>Track every project's status, team, progress and timeline.</p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn btn-outline btn-sm" onClick={load}>🔄 Refresh</button>
            <button className="btn btn-primary btn-sm"  onClick={() => setShowNew(true)}>➕ New Project</button>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:28 }}>
        {STAT_CARDS.map(s => (
          <StatCard
            key={s.key}
            label={s.label}
            value={s.value}
            icon={s.icon}
            color={s.color}
            active={filter === s.key}
            onClick={() => setFilter(s.key)}
          />
        ))}
      </div>

      {/* Active filter indicator */}
      {filter !== 'All' && (
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
          <span style={{ fontSize:13, color:'var(--text-muted)' }}>Showing:</span>
          <span style={{
            padding:'4px 12px', borderRadius:20,
            background: (STATUS_CONFIG[filter]?.color || '#8B5CF6') + '20',
            color: STATUS_CONFIG[filter]?.color || '#8B5CF6',
            fontSize:12, fontWeight:700,
          }}>{filter}</span>
          <button onClick={() => setFilter('All')} style={{
            fontSize:11, color:'var(--text-muted)', background:'none',
            border:'none', cursor:'pointer', textDecoration:'underline',
          }}>Clear filter</button>
        </div>
      )}

      {/* Filters + Search */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        <input
          className="form-control"
          placeholder="🔍 Search by project, description or head..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex:1, minWidth:220, maxWidth:400 }}
        />
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {['All', ...Object.keys(STATUS_CONFIG)].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
            >{f}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        {loading ? (
          <div style={{ padding:'60px 0', textAlign:'center', color:'var(--text-muted)' }}>
            <div style={{ fontSize:36, marginBottom:12 }}>⏳</div>
            <div>Loading projects...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:'70px 20px', textAlign:'center', color:'var(--text-muted)' }}>
            <div style={{ fontSize:48, marginBottom:14 }}>📭</div>
            <div style={{ fontWeight:700, fontSize:16, marginBottom:6 }}>No Projects Found</div>
            <div style={{ fontSize:13 }}>
              {projects.length === 0
                ? 'Click "New Project" to create your first project.'
                : 'No results match your current filter.'}
            </div>
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'var(--bg3)', borderBottom:'1px solid var(--panel-border)' }}>
                  {['Project','Status','Priority','Progress','Team','Timeline','Budget','Actions'].map(h => (
                    <th key={h} style={{
                      padding:'13px 16px', textAlign:'left', fontSize:11,
                      fontWeight:800, letterSpacing:'0.08em', textTransform:'uppercase',
                      color:'var(--text-muted)', whiteSpace:'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr
                    key={p.id}
                    style={{ borderBottom:'1px solid var(--panel-border)', transition:'background 0.15s', cursor:'pointer' }}
                    onClick={() => setSelected(p)}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Project */}
                    <td style={{ padding:'14px 16px', maxWidth:300 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <div style={{
                          width:38, height:38, borderRadius:10, flexShrink:0,
                          background:`${p.color}22`,
                          display:'flex', alignItems:'center', justifyContent:'center', fontSize:18,
                        }}>{p.icon}</div>
                        <div style={{ minWidth:0 }}>
                          <div style={{ fontWeight:700, fontSize:14, lineHeight:1.3 }}>{p.name}</div>
                          <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2,
                            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:240 }}>
                            {p.description || '—'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding:'14px 16px', whiteSpace:'nowrap' }}>
                      <StatusBadge status={p.status}/>
                    </td>

                    {/* Priority */}
                    <td style={{ padding:'14px 16px', whiteSpace:'nowrap' }}>
                      <PriorityBadge priority={p.priority}/>
                    </td>

                    {/* Progress */}
                    <td style={{ padding:'14px 16px', minWidth:140 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{
                          flex:1, height:6, background:'var(--bg3)',
                          borderRadius:3, overflow:'hidden', minWidth:80,
                        }}>
                          <div style={{
                            height:'100%', width:`${p.progress}%`,
                            background:p.color, transition:'width 0.4s',
                          }}/>
                        </div>
                        <span style={{ fontSize:12, fontWeight:700, color:p.color, minWidth:34, textAlign:'right' }}>
                          {p.progress}%
                        </span>
                      </div>
                    </td>

                    {/* Team */}
                    <td style={{ padding:'14px 16px' }}>
                      <MemberStack head={p.head} team={p.team}/>
                    </td>

                    {/* Timeline */}
                    <td style={{ padding:'14px 16px', whiteSpace:'nowrap' }}>
                      <div style={{ fontSize:12, color:'var(--text-soft)' }}>
                        {formatDate(p.startDate)}
                      </div>
                      <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>
                        → {formatDate(p.endDate)}
                      </div>
                    </td>

                    {/* Budget */}
                    <td style={{ padding:'14px 16px', whiteSpace:'nowrap' }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'#00c896' }}>
                        {p.budget || '—'}
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ padding:'14px 16px' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                        <button
                          onClick={() => setSelected(p)}
                          style={{
                            padding:'5px 10px', fontSize:11, fontWeight:700, cursor:'pointer',
                            borderRadius:8, border:'1px solid var(--panel-border)',
                            background:'rgba(59,130,246,0.12)', color:'#60a5fa',
                            whiteSpace:'nowrap',
                          }}>👁️ View</button>
                        <button
                          onClick={() => setEditing(p)}
                          style={{
                            padding:'5px 10px', fontSize:11, fontWeight:700, cursor:'pointer',
                            borderRadius:8, border:'none',
                            background:'#8B5CF6', color:'#fff', whiteSpace:'nowrap',
                          }}>✏️ Edit</button>
                        <button
                          onClick={() => setDeleting(p)}
                          style={{
                            padding:'5px 10px', fontSize:11, fontWeight:700, cursor:'pointer',
                            borderRadius:8, border:'none',
                            background:'#ef4d6a', color:'#fff', whiteSpace:'nowrap',
                          }}>🗑️ Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        @keyframes _toastIn { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  )
}