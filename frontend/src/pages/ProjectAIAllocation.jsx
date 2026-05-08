import { useState, useRef } from 'react'
import { allocationAPI, pdfAPI, projectAPI } from '../utils/api'
import { useNavigate } from 'react-router-dom'
import './ProjectAIAllocation.css'

const STAGES = [
  { n: 1, title: 'PDF Upload & Parse',  desc: 'Upload project brief PDF — Python extracts requirements', icon: '📄' },
  { n: 2, title: 'Skill Matching',      desc: 'AI matches required skills against staff competencies',    icon: '🎯' },
  { n: 3, title: 'Availability Check',  desc: 'Filters out staff currently on leave or overloaded',       icon: '📅' },
  { n: 4, title: 'Workload Balance',    desc: 'Applies workload penalty to prevent burnout',              icon: '⚖️' },
  { n: 5, title: 'Composite Scoring',   desc: 'Computes final match score for each candidate',            icon: '📊' },
  { n: 6, title: 'Optimal Allocation',  desc: 'Recommends best candidate + suggested team',               icon: '🏆' },
]

const MOCK_STAFF = [
  { id: 1, name: 'Shankar Rajan',  role: 'AI/ML Engineer',       skills: ['Python','AI','React','TensorFlow'],           availability: 'Available', dept: 'Engineering', color: '#8B5CF6', experience: 6, pastPerformance: 94, currentProjects: 1 },
  { id: 2, name: 'Arun Kumar',     role: 'Full Stack Developer', skills: ['React','Node.js','SQL','JavaScript'],         availability: 'Busy',      dept: 'Engineering', color: '#F87171', experience: 4, pastPerformance: 80, currentProjects: 3 },
  { id: 3, name: 'Priya Nair',     role: 'Data Scientist',       skills: ['Python','ML','SQL','Pandas','Scikit-learn'],  availability: 'Available', dept: 'Data',        color: '#00C896', experience: 5, pastPerformance: 92, currentProjects: 1 },
  { id: 4, name: 'Vikram Singh',   role: 'Backend Developer',    skills: ['Java','SQL','Python','Spring Boot'],          availability: 'Available', dept: 'Engineering', color: '#FF9F43', experience: 7, pastPerformance: 87, currentProjects: 2 },
  { id: 5, name: 'Divya Menon',    role: 'Frontend Developer',   skills: ['React','HTML5','CSS3','JavaScript','Figma'],  availability: 'Available', dept: 'Design',      color: '#38BDF8', experience: 3, pastPerformance: 78, currentProjects: 1 },
  { id: 6, name: 'Rahul Sharma',   role: 'DevOps Engineer',      skills: ['Python','Docker','Kubernetes','SQL'],         availability: 'Busy',      dept: 'Infra',       color: '#A78BFA', experience: 5, pastPerformance: 83, currentProjects: 2 },
  { id: 7, name: 'Meena Krishnan', role: 'Project Manager',      skills: ['Agile','Scrum','JIRA','SQL'],                 availability: 'Available', dept: 'Management',  color: '#34D399', experience: 9, pastPerformance: 91, currentProjects: 1 },
  { id: 8, name: 'Arjun Pillai',   role: 'Security Engineer',    skills: ['Python','JavaScript','SQL','Cybersecurity'],  availability: 'Available', dept: 'Security',    color: '#FCD34D', experience: 6, pastPerformance: 85, currentProjects: 1 },
]

const WEIGHTS = { skill: 0.35, avail: 0.25, exp: 0.20, perf: 0.20 }
const MAX_EXP = 10
const AVAIL_SCORES = { Available: 100, Busy: 40, Leave: 0 }
const WORKLOAD_PENALTY = (n) => n > 2 ? 20 : n > 1 ? 10 : 0

function computeScore(emp, requiredSkills) {
  if (!requiredSkills.length) return 50
  const empSkills = (emp.skills || []).map(s => s.toLowerCase())
  const matched = requiredSkills.filter(sk => empSkills.some(es => es.includes(sk.toLowerCase()) || sk.toLowerCase().includes(es)))
  const sSkill = (matched.length / requiredSkills.length) * 100
  const sAvail = AVAIL_SCORES[emp.availability] ?? 0
  const sExp   = Math.min((emp.experience / MAX_EXP) * 100, 100)
  const sPerf  = emp.pastPerformance ?? 75
  const penalty = WORKLOAD_PENALTY(emp.currentProjects ?? 0)
  const raw = sSkill * WEIGHTS.skill + sAvail * WEIGHTS.avail + sExp * WEIGHTS.exp + sPerf * WEIGHTS.perf - penalty
  return Math.round(Math.max(0, Math.min(100, raw)))
}

function getSkillMatches(emp, requiredSkills) {
  const empSkills = (emp.skills || []).map(s => s.toLowerCase())
  return requiredSkills.filter(sk => empSkills.some(es => es.includes(sk.toLowerCase()) || sk.toLowerCase().includes(es)))
}

function initials(name) {
  return (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

/* ---------------- SCORE RING ---------------- */
function ScoreRing({ score, size = 100 }) {
  const r = (size / 2) - 10
  const circ = 2 * Math.PI * r
  const pct = score / 100
  const col = score >= 70 ? '#10b981' : score >= 45 ? '#f59e0b' : '#ef4444'
  return (
    <div className="ai-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="ai-ring-svg">
        <defs>
          <filter id={`ai-glow-${size}`}>
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
        <circle
          cx={size/2} cy={size/2} r={r}
          fill="none" stroke={col} strokeWidth={8}
          strokeDasharray={`${pct * circ} ${circ}`}
          strokeLinecap="round"
          filter={`url(#ai-glow-${size})`}
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <div className="ai-ring-text" style={{ color: col, fontSize: size > 80 ? 22 : 15 }}>
        {score}%
      </div>
    </div>
  )
}

/* ---------------- STAGE BADGE ---------------- */
function StageBadge({ stage, active, done, running }) {
  const state = done ? 'done' : active ? 'active' : 'idle'
  return (
    <div className={`ai-stage ai-stage-${state}`}>
      <div className="ai-stage-num">
        {done ? '✓' : stage.n}
      </div>
      <div className="ai-stage-content">
        <h4>{stage.icon} {stage.title}</h4>
        <p>{stage.desc}</p>
      </div>
      {active && running && <span className="ai-spinner" />}
    </div>
  )
}

/* ---------------- AVATAR ---------------- */
function Avatar({ name, color, size = 44, fontSize }) {
  return (
    <div
      className="ai-avatar"
      style={{
        width: size, height: size,
        background: `linear-gradient(180deg, ${color || '#7c5cff'}, ${color || '#5b3fd1'})`,
        fontSize: fontSize || Math.round(size * 0.38),
      }}
    >
      {initials(name)}
    </div>
  )
}

/* ---------------- PROCEED MODAL ---------------- */
function ProceedModal({ results, projectName, skills, onClose }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null)
  const [saveLog, setSaveLog] = useState([])
  const navigate = useNavigate()


  const overview = {
    name: projectName || 'AI-Allocated Project',
    description: `This project has been allocated by the SPA AI engine based on required skills: ${skills.join(', ')}.`,
    skills,
    lead: results.best,
    team: results.team,
  }

  const tasks = [
    { name: 'Kickoff Meeting & Requirements Review', done: false },
    { name: 'Environment Setup & Repository Creation', done: false },
    { name: 'Sprint 1 Planning', done: false },
    { name: 'Initial Development Phase', done: false },
    { name: 'Code Review & QA', done: false },
    { name: 'UAT & Stakeholder Review', done: false },
    { name: 'Final Deployment', done: false },
  ]

  const milestones = [
    { name: 'Project Kickoff',  date: new Date().toISOString().slice(0,10), done: false },
    { name: 'Phase 1 Complete', date: new Date(Date.now()+30*86400000).toISOString().slice(0,10), done: false },
    { name: 'Beta Release',     date: new Date(Date.now()+60*86400000).toISOString().slice(0,10), done: false },
    { name: 'Final Launch',     date: new Date(Date.now()+90*86400000).toISOString().slice(0,10), done: false },
  ]

  const handleSaveAndNotify = async () => {
    try {
      setSaving(true)
      setSaveStatus('saving')
      setSaveLog([])

      const lead = results.best
      const teamMembers = results.team || []
      const allMembers = [lead, ...teamMembers].filter(Boolean)

      setSaveLog(l => [...l, '📁 Saving project to database...'])
      const payload = {
        name: overview.name,
        description: overview.description,
        status: 'In Progress',
        priority: 'High',
        progress: 12,
        completion: 12,
        startDate: new Date().toISOString().slice(0,10),
        endDate: milestones[milestones.length - 1]?.date || '',
        deadline: milestones[milestones.length - 1]?.date || '',
        budget: 0,
        teamSize: allMembers.length || 1,
        tech: skills,
        head: lead ? { name: lead.name, role: lead.role, color: lead.color || '#7c5cff' } : 'TBD',
        team: teamMembers.map((m) => ({ name: m.name, role: m.role, color: m.color || '#888' })),
        assignedEmployees: allMembers.map(m => m.name),
        tasks,
        milestones,
        aiSummary: results.analysis?.summary || '',
        riskLevel: results.analysis?.deliveryRisk || 'Medium',
        workloadInsights: results.analysis || null,
        icon: '🚀',
        color: '#7c5cff',
      }

      const created = await projectAPI.create(payload)
      setSaveLog(l => [...l, `✅ Project saved (ID: ${created?.id || '—'})`])

      setSaveStatus('notifying')
      setSaveLog(l => [...l, '📧 Sending PDF notifications to team members...'])

      try {
        const notifyData = await allocationAPI.sendProjectNotifications({
          projectId: created?.id,
          projectName: overview.name,
          description: overview.description,
          skills,
          aiSummary: results.analysis?.summary || '',
          riskLevel: results.analysis?.deliveryRisk || 'Medium',
          startDate: payload.startDate,
          endDate: payload.endDate,
          milestones, tasks,
          lead, teamMembers,
        })

        const notified = notifyData.notified || []
        const emailsSent = notifyData.emailsSent || 0
        setSaveLog(l => [
          ...l,
          `🔔 Notifications saved for ${notified.length} member(s)`,
          emailsSent > 0
            ? `📩 PDF emailed to ${emailsSent} member(s)`
            : `ℹ️ Email not sent (configure SMTP in backend .env to enable)`,
        ])
      } catch (notifyErr) {
        setSaveLog(l => [...l, `⚠️ Notification delivery had issues: ${notifyErr.message || 'project still saved'}`])
      }

      setSaveStatus('done')
      setSaveLog(l => [...l, '🎉 All done! Redirecting to Projects...'])

      setTimeout(() => { onClose(); navigate('/projects') }, 1800)
    } catch (err) {
      setSaveStatus('error')
      setSaveLog(l => [...l, `❌ Error: ${err.message}`])
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="ai-overlay" onClick={e => e.target === e.currentTarget && !saving && onClose()}>
      <div className="ai-modal">
        <div className="ai-modal-header">
          <div className="ai-modal-title">
            <div className="ai-modal-title-icon">🚀</div>
            <div>
              <h2>{overview.name}</h2>
              <div className="ai-modal-badges">
                <span className="ai-chip ai-chip-success">✅ AI Allocated</span>
                <span className="ai-chip ai-chip-info">In Progress</span>
              </div>
            </div>
          </div>
          {!saving && <button className="ai-icon-btn" onClick={onClose} aria-label="Close">✕</button>}
        </div>

        <div className="ai-modal-body">
          {saveLog.length > 0 && (
            <div className="ai-save-log">
              {saveLog.map((line, i) => (
                <div
                  key={i}
                  className={`ai-save-log-line ${line.startsWith('❌') ? 'err' : line.startsWith('✅') || line.startsWith('🎉') ? 'ok' : ''}`}
                >
                  {line}
                </div>
              ))}
              {(saveStatus === 'saving' || saveStatus === 'notifying') && (
                <div className="ai-save-log-status">
                  <span className="ai-spinner ai-spinner-sm" />
                  <span>{saveStatus === 'saving' ? 'Saving…' : 'Sending notifications & PDF emails…'}</span>
                </div>
              )}
            </div>
          )}

          {saveStatus !== 'done' && (
            <>
              <div className="ai-tabs">
                {['overview', 'team', 'tasks', 'milestones'].map(t => (
                  <button
                    key={t}
                    className={`ai-tab ${activeTab === t ? 'active' : ''}`}
                    onClick={() => setActiveTab(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {activeTab === 'overview' && (
                <div className="ai-tab-content">
                  <div className="ai-info-card">
                    <div className="ai-info-card-title">📋 Project Overview</div>
                    <p>{overview.description}</p>
                  </div>

                  <div className="ai-info-block">
                    <div className="ai-info-block-title">🎯 Required Skills</div>
                    <div className="ai-chip-row">
                      {skills.map(s => (
                        <span key={s} className="ai-chip ai-chip-success">✓ {s}</span>
                      ))}
                    </div>
                  </div>

                  {results.best && (
                    <div className="ai-best-card">
                      <div className="ai-best-card-title">🏆 AI Best Match — Project Lead</div>
                      <div className="ai-best-card-body">
                        <ScoreRing score={results.best.matchScore} size={64} />
                        <div className="ai-best-card-info">
                          <div className="ai-best-card-name">{results.best.name}</div>
                          <div className="ai-best-card-role">
                            {results.best.role} · {results.best.dept || results.best.department}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="ai-notice ai-notice-success">
                    📧 On save: A <strong>PDF report</strong> with full project details will be automatically sent to the Project Lead and all Team Members via email.
                  </div>
                </div>
              )}

              {activeTab === 'team' && (
                <div className="ai-tab-content">
                  {results.best && (
                    <>
                      <div className="ai-section-title primary">Project Lead (Best Match)</div>
                      <div className="ai-lead-card">
                        <Avatar name={results.best.name} color={results.best.color} size={56} />
                        <div className="ai-lead-card-info">
                          <div className="ai-lead-card-name">{results.best.name}</div>
                          <div className="ai-lead-card-role">{results.best.role}</div>
                          <span className="ai-chip ai-chip-danger" style={{ marginTop: 6 }}>
                            👑 Project Lead · {results.best.matchScore}% Match
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {results.team?.length > 0 && (
                    <>
                      <div className="ai-section-title">Suggested Team ({results.team.length})</div>
                      <div className="ai-team-grid">
                        {results.team.map((m, i) => (
                          <div key={i} className="ai-team-tile">
                            <Avatar name={m.name} color={m.color} size={48} />
                            <div className="ai-team-tile-info">
                              <div className="ai-team-tile-name">{m.name}</div>
                              <div className="ai-team-tile-role">{m.role}</div>
                              <span className="ai-chip ai-chip-info" style={{ marginTop: 4 }}>
                                Match: {m.matchScore}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'tasks' && (
                <div className="ai-tab-content">
                  <div className="ai-list-header">
                    <div>Auto-generated Tasks</div>
                    <span className="ai-chip ai-chip-info">0/{tasks.length} Done</span>
                  </div>
                  <div className="ai-task-list">
                    {tasks.map((t, i) => (
                      <div key={i} className="ai-task-item">
                        <div className="ai-task-num">{i + 1}</div>
                        <div className="ai-task-name">{t.name}</div>
                        <span className="ai-chip ai-chip-muted">⏳ Pending</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'milestones' && (
                <div className="ai-tab-content">
                  <div className="ai-timeline">
                    {milestones.map((m, i) => (
                      <div key={i} className="ai-timeline-item">
                        <div className="ai-timeline-dot" />
                        <div className="ai-timeline-card">
                          <div className="ai-timeline-card-head">
                            <div className="ai-timeline-name">{m.name}</div>
                            <span className="ai-chip ai-chip-muted">⏳ Upcoming</span>
                          </div>
                          <div className="ai-timeline-date">📅 {m.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {saveStatus !== 'done' && (
          <div className="ai-modal-footer">
            <button className="ai-btn ai-btn-outline" onClick={onClose} disabled={saving}>Close</button>
            <button
              className="ai-btn ai-btn-primary"
              disabled={saving}
              onClick={handleSaveAndNotify}
            >
              {saving ? (
                <>
                  <span className="ai-spinner ai-spinner-sm" />
                  {saveStatus === 'notifying' ? 'Sending PDF Notifications…' : 'Saving Project…'}
                </>
              ) : (
                '✅ Save Project & Send PDF to Team →'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ---------------- MAIN PAGE ---------------- */
export default function ProjectAIAllocation() {
  const [file, setFile] = useState(null)
  const [skills, setSkills] = useState([])
  const [skillInput, setSkillInput] = useState('')
  const [stage, setStage] = useState(0)
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState(null)
  const [pdfText, setPdfText] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [error, setError] = useState('')
  const [backendMode, setBackendMode] = useState(null)
  const [showProceed, setShowProceed] = useState(false)
  const fileRef = useRef()

  const addSkill = () => {
    const s = skillInput.trim()
    if (s && !skills.includes(s)) {
      setSkills(sk => [...sk, s])
      setSkillInput('')
    }
  }

  const handleFile = async (f) => {
    if (!f) return
    setFile(f)
    setStage(1)
    setResults(null)
    setError('')
    try {
      const data = await pdfAPI.analyze(f)
      setBackendMode(true)
      setPdfText(data.text?.slice(0, 2000) || `Extracted from: ${f.name}`)
      if (data.skills?.length) setSkills(data.skills)
    } catch {
      setBackendMode(false)
      const simText = `Extracted from: ${f.name}\n\nProject: Enterprise Web Platform\nRequirements:\n- Frontend: React, TypeScript\n- Backend: Node.js, Python\n- Infrastructure: AWS, Docker\n- Database: PostgreSQL, SQL\n- CI/CD Pipeline`
      setPdfText(simText)
      setSkills(['React', 'Python', 'AWS', 'Docker', 'Node.js'])
    }
    setStage(0)
  }

  const animateStages = async (onDone) => {
    for (let i = 1; i <= 6; i++) {
      setStage(i)
      await new Promise(r => setTimeout(r, 600))
    }
    onDone()
  }

  const runAllocation = async () => {
    if (!skills.length) { alert('Please add required skills or upload a PDF first'); return }
    setRunning(true)
    setResults(null)
    setError('')
    setStage(1)

    const token = localStorage.getItem('spa_token')
    const isDemo = token === 'demo-mode' || !token

    if (!isDemo) {
      let apiResult = null
      let apiError = null
      const apiPromise = allocationAPI.run({ requiredSkills: skills, projectName: projectName || undefined })
        .then(r => { apiResult = r })
        .catch(e => { apiError = e })
      await animateStages(async () => { await apiPromise })
      if (apiResult?.success) {
        setBackendMode(true)
        setResults(apiResult)
        setRunning(false)
        return
      }
      if (apiError) setBackendMode(false)
    }

    setBackendMode(false)
    setStage(0)
    for (let i = 1; i <= 6; i++) {
      setStage(i)
      await new Promise(r => setTimeout(r, 620))
    }

    const eligible = MOCK_STAFF.filter(s => s.availability !== 'Leave')
    const scored = eligible.map(s => ({
      ...s,
      matchScore: computeScore(s, skills),
      skillMatches: getSkillMatches(s, skills),
      skillMiss: skills.filter(sk => !getSkillMatches(s, [sk]).length),
      breakdown: {
        skillScore: Math.round((getSkillMatches(s, skills).length / skills.length) * 100),
        availabilityScore: AVAIL_SCORES[s.availability],
        experienceScore: Math.round(Math.min((s.experience / MAX_EXP) * 100, 100)),
        performanceScore: s.pastPerformance,
        workloadPenalty: WORKLOAD_PENALTY(s.currentProjects),
        composite: computeScore(s, skills),
      },
    }))
    scored.sort((a, b) => b.matchScore - a.matchScore)

    const best = scored[0] || null
    const team = scored.slice(1, 4).filter(s => s.matchScore > 40)
    const qualified = scored.filter(s => s.matchScore >= 60)
    const coverage = best && skills.length ? Math.round((best.skillMatches.length / skills.length) * 100) : 0

    setResults({
      success: true,
      best, team, allScored: scored,
      stats: {
        evaluated: MOCK_STAFF.length,
        eligible: eligible.length,
        qualified: qualified.length,
        skillCoverage: coverage,
      },
    })
    setRunning(false)
  }

  const reset = () => {
    setFile(null); setSkills([]); setSkillInput('')
    setStage(0); setResults(null); setPdfText('')
    setProjectName(''); setError(''); setBackendMode(null)
  }

  return (
    <div className="ai-page">
      {/* Page header */}
      <div className="ai-page-header">
        <div className="ai-page-header-text">
          <h1>Project AI Allocation <span className="ai-wave">🤖</span></h1>
          <p>Upload a PDF project brief — Python AI engine analyzes &amp; allocates best-fit staff</p>
        </div>
        <div className="ai-page-header-actions">
          {backendMode === true  && <span className="ai-chip ai-chip-success">🟢 Python Backend Connected</span>}
          {backendMode === false && <span className="ai-chip ai-chip-warn">🟡 Demo Mode</span>}
          {(file || results) && (
            <button className="ai-btn ai-btn-outline ai-btn-sm" onClick={reset}>🔄 Reset</button>
          )}
        </div>
      </div>

      <div className="ai-grid">
        {/* LEFT COLUMN */}
        <div className="ai-col">
          {/* PDF Upload */}
          <section className="ai-card">
            <header className="ai-card-header">
              <div className="ai-card-title">📄 PDF Upload</div>
              <span className="ai-chip ai-chip-info">Python Backend</span>
            </header>

            <div
              className={`ai-upload-zone ${dragOver ? 'dragover' : ''} ${file ? 'has-file' : ''}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
            >
              <div className="ai-upload-icon">📤</div>
              <h3>{file ? file.name : 'Drop PDF here or click to upload'}</h3>
              <p>{file ? `✅ File loaded — ${(file.size / 1024).toFixed(1)} KB` : 'Project brief, requirements doc, or any PDF'}</p>
              <input
                ref={fileRef} type="file" accept=".pdf,.txt,.doc,.docx" hidden
                onChange={e => handleFile(e.target.files[0])}
              />
            </div>

            {pdfText && (
              <div className="ai-pdf-preview">
                <div className={`ai-pdf-preview-label ${backendMode ? 'ok' : 'warn'}`}>
                  {backendMode ? '✅ PDF EXTRACTED (Python Backend)' : '⚡ SIMULATED EXTRACTION (Demo Mode)'}
                </div>
                <pre>{pdfText}</pre>
              </div>
            )}
          </section>

          {/* Project Details */}
          <section className="ai-card">
            <header className="ai-card-header">
              <div className="ai-card-title">📋 Project Details</div>
            </header>

            <div className="ai-field">
              <label>Project Name</label>
              <input
                className="ai-input"
                placeholder="e.g. SPA Mobile App"
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
              />
            </div>

            <div className="ai-field">
              <label>Required Skills (auto-extracted or manual)</label>
              <div className="ai-input-row">
                <input
                  className="ai-input"
                  placeholder="Add a skill…"
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                />
                <button className="ai-btn ai-btn-primary ai-btn-sm" onClick={addSkill}>Add</button>
              </div>
              <div className="ai-chip-row">
                {skills.length === 0 ? (
                  <span className="ai-empty-hint">No skills added yet — upload PDF or add manually</span>
                ) : (
                  skills.map(s => (
                    <span key={s} className="ai-chip ai-chip-primary">
                      {s}
                      <button onClick={() => setSkills(sk => sk.filter(x => x !== s))} aria-label={`Remove ${s}`}>×</button>
                    </span>
                  ))
                )}
              </div>
            </div>
          </section>

          {/* Run Button */}
          <button
            className="ai-btn ai-btn-primary ai-btn-lg ai-btn-block"
            onClick={runAllocation}
            disabled={running || !skills.length}
          >
            {running ? (
              <>
                <span className="ai-spinner ai-spinner-sm" />
                Running AI Pipeline… Stage {stage}/6
              </>
            ) : (
              '🚀 Run AI Allocation'
            )}
          </button>

          {error && <div className="ai-error">{error}</div>}
        </div>

        {/* RIGHT COLUMN */}
        <div className="ai-col">
          {/* Pipeline Stages */}
          <section className="ai-card">
            <header className="ai-card-header">
              <div className="ai-card-title">⚙️ AI Pipeline Stages</div>
              {running && <span className="ai-running-tag">Running…</span>}
            </header>
            <div className="ai-stage-list">
              {STAGES.map(s => (
                <StageBadge
                  key={s.n}
                  stage={s}
                  active={stage === s.n}
                  done={stage > s.n || (!running && results && stage === 0)}
                  running={running}
                />
              ))}
            </div>
          </section>

          {results && (
            <>
              {/* Stats */}
              <div className="ai-stats-grid">
                {[
                  { label: 'Evaluated', value: results.stats.evaluated, icon: '🔍', color: '#4cc9f0' },
                  { label: 'Eligible',  value: results.stats.eligible,  icon: '✅', color: '#10b981' },
                  { label: 'Qualified', value: results.stats.qualified, icon: '⭐', color: '#f59e0b' },
                  { label: 'Coverage',  value: `${results.stats.skillCoverage}%`, icon: '🎯', color: '#7c5cff' },
                ].map(s => (
                  <div key={s.label} className="ai-stat-card">
                    <div className="ai-stat-icon">{s.icon}</div>
                    <div className="ai-stat-value" style={{ color: s.color }}>{s.value}</div>
                    <div className="ai-stat-label">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Best Match */}
              {results.best && (
                <section className="ai-card ai-best-match-card">
                  <header className="ai-best-header">
                    <span className="ai-best-icon">🏆</span>
                    <div className="ai-best-title">Best Match</div>
                    <span className="ai-chip ai-chip-danger">Top Pick</span>
                    {backendMode && <span className="ai-chip ai-chip-success">Python AI</span>}
                  </header>

                  <div className="ai-best-body">
                    <ScoreRing score={results.best.matchScore} size={96} />
                    <div className="ai-best-info">
                      <div className="ai-best-name">{results.best.name}</div>
                      <div className="ai-best-role">
                        {results.best.role} · {results.best.dept || results.best.department}
                      </div>

                      {results.best.breakdown && (
                        <div className="ai-breakdown-grid">
                          {[
                            { label: 'Skill',    v: results.best.breakdown.skillScore },
                            { label: 'Avail.',   v: results.best.breakdown.availabilityScore },
                            { label: 'Exp.',     v: results.best.breakdown.experienceScore },
                            { label: 'Perf.',    v: results.best.breakdown.performanceScore },
                            { label: 'Penalty',  v: results.best.breakdown.workloadPenalty, neg: true },
                          ].map(b => (
                            <div key={b.label} className="ai-breakdown-item">
                              <div className={`ai-breakdown-value ${b.neg ? 'neg' : 'pos'}`}>
                                {b.neg ? '−' : ''}{b.v}
                              </div>
                              <div className="ai-breakdown-label">{b.label}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="ai-chip-row" style={{ marginTop: 12 }}>
                        {(results.best.skillMatches || results.best.skills || []).slice(0, 6).map(sk => (
                          <span key={sk} className="ai-chip ai-chip-success">✓ {sk}</span>
                        ))}
                        {(results.best.skillMiss || []).slice(0, 3).map(sk => (
                          <span key={sk} className="ai-chip ai-chip-danger">✗ {sk}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Suggested Team */}
              {results.team?.length > 0 && (
                <section className="ai-card">
                  <header className="ai-card-header">
                    <div className="ai-card-title">👥 Suggested Team Members</div>
                  </header>
                  <div className="ai-suggest-list">
                    {results.team.map((m, i) => (
                      <div key={i} className="ai-suggest-item">
                        <Avatar name={m.name} color={m.color} size={42} />
                        <div className="ai-suggest-info">
                          <div className="ai-suggest-name">{m.name}</div>
                          <div className="ai-suggest-role">{m.role} · {m.dept || m.department}</div>
                        </div>
                        <ScoreRing score={m.matchScore} size={52} />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Proceed Project */}
              <button
                className="ai-btn ai-btn-success ai-btn-lg ai-btn-block"
                onClick={() => setShowProceed(true)}
              >
                🚀 Proceed Project — View Full Details &amp; Send PDF
              </button>

              {/* All Candidates */}
              {results.allScored?.length > 0 && (
                <section className="ai-card">
                  <header className="ai-card-header">
                    <div className="ai-card-title">📋 All Candidates Ranked</div>
                  </header>
                  <div className="ai-rank-list">
                    {results.allScored.map((m, i) => (
                      <div
                        key={i}
                        className={`ai-rank-item ${i === 0 ? 'top' : ''}`}
                      >
                        <Avatar name={m.name} color={m.color} size={32} fontSize={11} />
                        <div className="ai-rank-info">
                          <div className="ai-rank-name">
                            {m.name} {i === 0 ? '🏆' : ''}
                          </div>
                          <div className="ai-rank-role">{m.role}</div>
                        </div>
                        <div className="ai-rank-bar">
                          <div
                            className="ai-rank-bar-fill"
                            style={{
                              width: `${m.matchScore}%`,
                              background: m.matchScore >= 70 ? '#10b981' : m.matchScore >= 45 ? '#f59e0b' : '#ef4444',
                            }}
                          />
                        </div>
                        <div
                          className="ai-rank-score"
                          style={{ color: m.matchScore >= 70 ? '#10b981' : m.matchScore >= 45 ? '#f59e0b' : '#ef4444' }}
                        >
                          {m.matchScore}%
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>

      {showProceed && results && (
        <ProceedModal
          results={results}
          projectName={projectName}
          skills={skills}
          onClose={() => setShowProceed(false)}
        />
      )}
    </div>
  )
}