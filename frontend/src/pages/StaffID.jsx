import { useState, useEffect, useRef } from 'react'
import { employeeAPI, staffIdAPI } from '../utils/api'

// ── ID Card ───────────────────────────────────────────────────────────────────
function IDCard({ staff, creds, empId, cardRef }) {
  const batch = staff.doj ? new Date(staff.doj).getFullYear() : new Date().getFullYear()
  return (
    <div ref={cardRef} style={{
      width:340, minHeight:530, background:'#fff', borderRadius:18,
      boxShadow:'0 8px 40px rgba(0,0,0,0.28)', border:'1px solid #e0e0e0',
      overflow:'hidden', position:'relative', fontFamily:'Arial, sans-serif',
    }}>
      <div style={{ height:8, background:'linear-gradient(90deg,#7c5cff,#5b8cff,#38bdf8)' }} />
      <div style={{ position:'relative', zIndex:1, padding:'24px 24px 20px' }}>
        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:18 }}>
          <img src="/spa-logo.png" alt="SPA"
            style={{ height:48, objectFit:'contain', marginBottom:6 }}
            onError={e => { e.target.style.display='none' }} />
          <div style={{ fontSize:20, fontWeight:900, color:'#1a237e', letterSpacing:'0.15em' }}>SPA</div>
          <div style={{ fontSize:9, color:'#666', letterSpacing:'0.12em', textTransform:'uppercase' }}>Technologies Pvt. Ltd.</div>
        </div>
        {/* Photo */}
        <div style={{ display:'flex', justifyContent:'center', marginBottom:14 }}>
          <div style={{ width:96, height:96, borderRadius:12, background:'#f5f5f5',
            border:'3px solid #1a237e', display:'flex', alignItems:'center',
            justifyContent:'center', overflow:'hidden', boxShadow:'0 4px 16px rgba(26,35,126,0.15)' }}>
            {staff.imagePreview
              ? <img src={staff.imagePreview} alt={staff.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : <span style={{ fontSize:32, color:'#1a237e', opacity:0.4 }}>👤</span>}
          </div>
        </div>
        {/* Name */}
        <div style={{ textAlign:'center', marginBottom:3 }}>
          <div style={{ fontSize:18, fontWeight:900, color:'#1a237e', letterSpacing:'0.05em', textTransform:'uppercase' }}>
            {staff.name}
          </div>
        </div>
        <div style={{ height:2, background:'linear-gradient(90deg,transparent,#1a237e,transparent)', marginBottom:12, opacity:0.25 }} />
        {/* Details */}
        <div style={{ background:'rgba(26,35,126,0.04)', borderRadius:10, padding:'11px 13px',
          marginBottom:13, border:'1px solid rgba(26,35,126,0.1)' }}>
          {[
            { label:'Emp ID',  value: empId },
            { label:'Role',    value: staff.role || 'N/A' },
            { label:'Dept',    value: staff.department || staff.dept || 'N/A' },
            { label:'Batch',   value: String(batch) },
          ].map(item => (
            <div key={item.label} style={{ display:'flex', justifyContent:'space-between', marginBottom:5, fontSize:12 }}>
              <span style={{ color:'#555', fontWeight:600 }}>{item.label} :</span>
              <span style={{ color:'#1a237e', fontWeight:800 }}>{item.value}</span>
            </div>
          ))}
        </div>
        {/* Credentials */}
        <div style={{ background:'#f8f9ff', borderRadius:10, padding:'9px 13px',
          border:'1px solid #e8eaf6', marginBottom:13 }}>
          <div style={{ fontSize:9, fontWeight:800, color:'#7c5cff', marginBottom:7,
            letterSpacing:'0.1em', textTransform:'uppercase' }}>Login Credentials</div>
          <div style={{ fontSize:11, color:'#333', marginBottom:3 }}>📧 <strong>{creds.email}</strong></div>
          <div style={{ fontSize:11, color:'#333' }}>🔑 <strong>{creds.password}</strong></div>
        </div>
        {/* Footer */}
        <div style={{ textAlign:'center', fontSize:9, color:'#aaa', borderTop:'1px solid #eee', paddingTop:9 }}>
          <div style={{ fontWeight:700, color:'#1a237e', marginBottom:2 }}>portal.spa.com · Employee Portal</div>
          <div>This card is the property of SPA Technologies. If found, please return to HR.</div>
        </div>
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function StaffID() {
  const [staff, setStaff]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState(null)
  const [creds, setCreds]         = useState(null)
  const [empId, setEmpId]         = useState('')
  const [search, setSearch]       = useState('')
  const [copied, setCopied]       = useState('')
  const [generating, setGenerating] = useState(null)
  // Map: employeeId → { email, password, empId, generatedAt }
  const [credMap, setCredMap]     = useState({})
  const [toast, setToast]         = useState(null)
  const cardRef = useRef()

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3200)
  }

  useEffect(() => {
    employeeAPI.getAll().then(async data => {
      const normalized = data.map(e => ({
        ...e,
        dept:         e.department || e.dept || '',
        mobile:       e.phone || e.mobile || '',
        doj:          e.joinDate || e.join_date || e.doj || '',
        imagePreview: e.imagePreview || null,
      }))
      setStaff(normalized)
      setLoading(false)

      // Load persisted credentials for all employees
      const results = await Promise.all(
        normalized.map(e => staffIdAPI.getCredentials(e.id).catch(() => ({ exists: false })))
      )
      const map = {}
      results.forEach((r, i) => {
        if (r.exists && r.credentials) map[normalized[i].id] = r.credentials
      })
      setCredMap(map)
    }).catch(() => { setStaff([]); setLoading(false) })
  }, [])

  const filtered = staff.filter(s =>
    !search ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.dept || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleGenerate = async (s) => {
    setGenerating(s.id)
    try {
      const res = await staffIdAPI.generate(s.id)
      const c = res.credentials
      setCredMap(m => ({ ...m, [s.id]: c }))
      selectEmployee(s, c)
      showToast(`✅ Credentials generated for ${s.name}. Employee Portal login created!`)
    } catch (e) {
      showToast('Generation failed: ' + e.message, 'error')
    }
    setGenerating(null)
  }

  const selectEmployee = (s, c) => {
    setSelected(s)
    setCreds({ email: c.email, password: c.password })
    setEmpId(c.empId)
  }

  const handlePrint = () => {
    const content = cardRef.current
    if (!content) return
    const win = window.open('', '_blank', 'width=500,height=740')
    win.document.write(`<!DOCTYPE html><html><head><title>SPA ID Card – ${selected?.name}</title>
      <style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f0f0f0}
      @media print{body{background:white}}</style></head><body>${content.outerHTML}</body></html>`)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 600)
  }

  const copy = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label)
      setTimeout(() => setCopied(''), 2200)
    })
  }

  const copyAll = () => {
    copy(`Name: ${selected?.name}\nEmployee ID: ${empId}\nEmail: ${creds.email}\nPassword: ${creds.password}\nPortal: http://localhost:5174`, 'All')
  }

  return (
    <div>
      {toast && (
        <div style={{ position:'fixed', top:24, right:24, zIndex:9999, padding:'13px 20px',
          borderRadius:13, fontWeight:600, fontSize:14,
          background: toast.type === 'error' ? '#ef4d6a' : '#00c896', color:'#fff',
          boxShadow:'0 8px 32px rgba(0,0,0,0.35)', animation:'_slideDown 0.3s ease' }}>
          {toast.msg}
        </div>
      )}

      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Staff ID Cards 🪪</h1>
            <p>Generate company email, password and Employee Portal access for each staff member</p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span className="badge" style={{ background:'rgba(0,200,150,0.15)', color:'#00c896',
              border:'1px solid rgba(0,200,150,0.3)', padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:700 }}>
              🔒 Secure · Persisted
            </span>
          </div>
        </div>
      </div>

      <div className="grid-2-1" style={{ gap:24 }}>
        {/* ── Left: Staff list ── */}
        <div>
          <input className="form-control" placeholder="🔍 Search staff by name or department..."
            value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom:16 }} />

          {loading ? (
            <div className="empty-state"><div className="empty-state-icon">⏳</div><h3>Loading staff…</h3></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">👥</div>
              <h3>No staff found</h3><p>Add staff profiles first to generate ID cards</p></div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {filtered.map(s => {
                const has = !!credMap[s.id]
                const isGen = generating === s.id
                const isSel = selected?.id === s.id
                return (
                  <div key={s.id} style={{
                    background:'var(--panel)',
                    border:`1px solid ${isSel ? 'rgba(239,77,106,0.4)' : 'var(--panel-border)'}`,
                    borderRadius:'var(--radius)', padding:16,
                    display:'flex', alignItems:'center', gap:14, transition:'all 0.18s',
                    cursor: has ? 'pointer' : 'default',
                    boxShadow: isSel ? '0 0 0 2px rgba(239,77,106,0.15)' : 'none',
                  }}
                  onClick={() => has && selectEmployee(s, credMap[s.id])}>
                    <div style={{ width:48, height:48, borderRadius:12, background:'var(--bg3)',
                      border:'1px solid var(--panel-border)', display:'flex', alignItems:'center',
                      justifyContent:'center', flexShrink:0, overflow:'hidden' }}>
                      {s.imagePreview
                        ? <img src={s.imagePreview} alt={s.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                        : <span style={{ fontSize:22 }}>👤</span>}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:700, fontSize:14 }}>{s.name}</div>
                      <div style={{ fontSize:12, color:'var(--text-muted)' }}>{s.role} · {s.dept}</div>
                      {has && (
                        <div style={{ fontSize:11, color:'#00c896', marginTop:3, display:'flex', alignItems:'center', gap:6 }}>
                          ✅ {credMap[s.id].email}
                          <span style={{ color:'var(--text-muted)' }}>
                            · {credMap[s.id].generatedAt
                              ? new Date(credMap[s.id].generatedAt).toLocaleDateString('en-IN')
                              : ''}
                          </span>
                        </div>
                      )}
                    </div>
                    <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                      {has && (
                        <button className="btn btn-ghost btn-sm"
                          onClick={e => { e.stopPropagation(); selectEmployee(s, credMap[s.id]) }}>
                          👁 View
                        </button>
                      )}
                      <button className="btn btn-primary btn-sm"
                        disabled={isGen}
                        onClick={e => { e.stopPropagation(); handleGenerate(s) }}>
                        {isGen ? '⏳' : has ? '🔄 Re-Generate' : '⚡ Generate'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Right: ID Card Preview ── */}
        <div>
          {selected && creds ? (
            <div>
              <div style={{ fontSize:11, fontWeight:800, letterSpacing:'0.1em', textTransform:'uppercase',
                color:'var(--text-muted)', marginBottom:14 }}>ID CARD PREVIEW</div>
              <div style={{ display:'flex', justifyContent:'center', marginBottom:18 }}>
                <IDCard staff={selected} creds={creds} empId={empId} cardRef={cardRef} />
              </div>

              <button className="btn btn-primary" style={{ width:'100%', marginBottom:16 }} onClick={handlePrint}>
                🖨️ Print ID Card
              </button>

              {/* Quick copy panel */}
              <div className="card" style={{ padding:20 }}>
                <div style={{ fontWeight:700, marginBottom:14, fontSize:14 }}>📋 Quick Copy</div>
                <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
                  {[
                    { label:'Email',       value: creds.email,         icon:'📧' },
                    { label:'Password',    value: creds.password,      icon:'🔑' },
                    { label:'Employee ID', value: empId,               icon:'🪪' },
                    { label:'Portal URL',  value: 'http://localhost:5174', icon:'🔗' },
                  ].map(item => (
                    <div key={item.label} style={{ display:'flex', alignItems:'center', gap:10,
                      padding:'9px 12px', background:'var(--bg3)', borderRadius:10,
                      border:'1px solid var(--panel-border)' }}>
                      <span style={{ fontSize:16 }}>{item.icon}</span>
                      <span style={{ fontSize:11, color:'var(--text-muted)', width:76, flexShrink:0 }}>{item.label}</span>
                      <span style={{ fontSize:12, fontFamily:'monospace', color:'var(--text)', flex:1,
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.value}</span>
                      <button onClick={() => copy(item.value, item.label)}
                        style={{ background:'none', border:'none', cursor:'pointer', fontSize:16,
                          padding:'2px 4px', color: copied === item.label ? '#00c896' : 'var(--text-muted)' }}>
                        {copied === item.label ? '✅' : '📋'}
                      </button>
                    </div>
                  ))}
                </div>
                {copied && (
                  <div style={{ marginTop:10, fontSize:12, color:'#00c896', textAlign:'center' }}>
                    ✅ {copied} copied!
                  </div>
                )}
                <button className="btn btn-outline" style={{ width:'100%', marginTop:14 }} onClick={copyAll}>
                  📋 Copy All Credentials
                </button>

                {/* Portal confirmation */}
                <div style={{ marginTop:14, padding:'12px 14px', background:'rgba(0,200,150,0.07)',
                  borderRadius:11, border:'1px solid rgba(0,200,150,0.2)', fontSize:12, color:'#00c896',
                  lineHeight:1.5 }}>
                  ✅ <strong>Employee Portal login created.</strong> The employee can log in at{' '}
                  <strong>http://localhost:5174</strong> using these credentials.
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
              justifyContent:'center', height:440, background:'var(--panel)',
              border:'2px dashed var(--panel-border)', borderRadius:'var(--radius)',
              textAlign:'center', padding:40 }}>
              <div style={{ fontSize:60, marginBottom:18 }}>🪪</div>
              <div style={{ fontWeight:700, fontSize:17, color:'var(--text-soft)', marginBottom:8 }}>
                No ID Card Selected
              </div>
              <div style={{ fontSize:13, color:'var(--text-muted)', maxWidth:280, lineHeight:1.6 }}>
                Click <strong>⚡ Generate</strong> on a staff member to create their company email,
                password and Employee Portal access.
                <br /><br />
                Once generated, use <strong>👁 View</strong> or <strong>🔄 Re-Generate</strong>.
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes _slideDown { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  )
}
