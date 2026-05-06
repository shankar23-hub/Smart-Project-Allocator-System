import { useState, useEffect } from 'react'
import { certificationAPI } from '../utils/api'

function StatusBadge({ status }) {
  const map = {
    Pending:  { bg:'rgba(255,159,67,0.15)',  color:'#ff9f43', border:'rgba(255,159,67,0.3)',  icon:'⏳' },
    Approved: { bg:'rgba(0,200,150,0.15)',   color:'#00c896', border:'rgba(0,200,150,0.3)',  icon:'✅' },
    Rejected: { bg:'rgba(239,77,106,0.15)',   color:'#ef4d6a', border:'rgba(239,77,106,0.3)',  icon:'❌' },
  }
  const s = map[status] || map.Pending
  return (
    <span style={{ padding:'4px 12px',borderRadius:20,fontSize:11,fontWeight:700,
      background:s.bg,color:s.color,border:`1px solid ${s.border}`,display:'inline-flex',alignItems:'center',gap:4 }}>
      {s.icon} {status}
    </span>
  )
}

function PDFModal({ pdfBase64, fileName, onClose }) {
  const dataUrl = pdfBase64?`data:application/pdf;base64,${pdfBase64}`:null
  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',zIndex:2000,
      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24 }}>
      <div style={{ width:'100%',maxWidth:960,background:'var(--panel)',borderRadius:20,
        overflow:'hidden',display:'flex',flexDirection:'column',maxHeight:'92vh' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',
          padding:'16px 24px',borderBottom:'1px solid var(--panel-border)',flexShrink:0 }}>
          <div style={{ fontWeight:700,fontSize:15 }}>📄 {fileName||'Certificate PDF'}</div>
          <button onClick={onClose} style={{ background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',fontSize:22 }}>✕</button>
        </div>
        <div style={{ flex:1,overflow:'hidden',padding:'4px 0' }}>
          {dataUrl
            ?<iframe src={dataUrl} style={{ width:'100%',height:'640px',border:'none' }} title="Certificate"/>
            :<div style={{ padding:40,textAlign:'center',color:'var(--text-muted)' }}>No PDF attached.</div>}
        </div>
      </div>
    </div>
  )
}

function AnalysisModal({ result, onClose }) {
  if (!result) return null
  const { verdict, verdict_color, verdict_icon, authenticity_score,
    positive_signals=[], negative_signals=[], warning_signals=[], skills_detected=[],
    metadata={}, text_preview='' } = result
  const bar = verdict_color==='green'?'#00c896':verdict_color==='yellow'?'#ff9f43':'#ef4d6a'

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',zIndex:2000,
      display:'flex',alignItems:'center',justifyContent:'center',padding:24 }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:'var(--panel)',border:'1px solid var(--panel-border)',
        borderRadius:22,width:'100%',maxWidth:680,maxHeight:'90vh',overflowY:'auto',padding:32 }}>

        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24 }}>
          <h2 style={{ margin:0,fontSize:20,fontWeight:800 }}>🔍 Certificate Analysis Report</h2>
          <button onClick={onClose} style={{ background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',fontSize:22 }}>✕</button>
        </div>

        {/* Verdict banner */}
        <div style={{ padding:24,borderRadius:16,background:`${bar}12`,border:`2px solid ${bar}40`,marginBottom:24,textAlign:'center' }}>
          <div style={{ fontSize:48,marginBottom:10 }}>{verdict_icon}</div>
          <div style={{ fontSize:24,fontWeight:900,color:bar,marginBottom:16 }}>{verdict}</div>
          <div style={{ fontSize:13,color:'var(--text-muted)',marginBottom:8 }}>Authenticity Score</div>
          <div style={{ height:14,background:'var(--bg3)',borderRadius:7,overflow:'hidden',margin:'0 auto',maxWidth:300 }}>
            <div style={{ height:'100%',width:`${authenticity_score}%`,background:bar,borderRadius:7,transition:'width 1s ease' }}/>
          </div>
          <div style={{ fontSize:30,fontWeight:900,color:bar,marginTop:8 }}>{authenticity_score}%</div>
        </div>

        {/* Metadata if available */}
        {Object.keys(metadata).length > 0 && (
          <div style={{ background:'var(--bg3)',borderRadius:12,padding:16,marginBottom:18,border:'1px solid var(--panel-border)' }}>
            <div style={{ fontWeight:700,fontSize:13,color:'var(--primary)',marginBottom:10 }}>📋 Document Metadata</div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8 }}>
              {Object.entries(metadata).filter(([,v])=>v).map(([k,v])=>(
                <div key={k} style={{ fontSize:12 }}>
                  <span style={{ color:'var(--text-muted)',textTransform:'capitalize' }}>{k.replace(/_/g,' ')}: </span>
                  <span style={{ color:'var(--text)',fontWeight:600 }}>{String(v).slice(0,50)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Signal groups */}
        {[
          { title:'✅ Positive Signals', items:positive_signals, color:'#00c896' },
          { title:'⚠️ Warnings',         items:warning_signals,  color:'#ff9f43' },
          { title:'❌ Red Flags',         items:negative_signals, color:'#ef4d6a' },
        ].map(g=>g.items.length>0&&(
          <div key={g.title} style={{ marginBottom:18 }}>
            <div style={{ fontWeight:700,fontSize:13,color:g.color,marginBottom:8 }}>{g.title}</div>
            {g.items.map((s,i)=>(
              <div key={i} style={{ padding:'9px 13px',background:'var(--bg3)',borderRadius:9,
                marginBottom:6,fontSize:13,borderLeft:`3px solid ${g.color}`,lineHeight:1.4 }}>{s}</div>
            ))}
          </div>
        ))}

        {/* Skills detected */}
        {skills_detected.length>0 && (
          <div style={{ marginTop:4 }}>
            <div style={{ fontWeight:700,fontSize:13,color:'var(--primary)',marginBottom:10 }}>
              🎯 Skills Detected ({skills_detected.length}) — auto-add to profile on Approve
            </div>
            <div style={{ display:'flex',flexWrap:'wrap',gap:7 }}>
              {skills_detected.map(sk=>(
                <span key={sk} style={{ padding:'4px 11px',borderRadius:20,fontSize:12,fontWeight:600,
                  background:'rgba(139,92,246,0.15)',color:'#8B5CF6',border:'1px solid rgba(139,92,246,0.3)' }}>{sk}</span>
              ))}
            </div>
          </div>
        )}

        {/* Text preview */}
        {text_preview && (
          <div style={{ marginTop:18 }}>
            <div style={{ fontWeight:700,fontSize:13,color:'var(--text-muted)',marginBottom:8 }}>📄 Extracted Text Preview</div>
            <div style={{ padding:12,background:'var(--bg3)',borderRadius:9,fontSize:11,
              color:'var(--text-muted)',lineHeight:1.6,maxHeight:100,overflow:'hidden',
              border:'1px solid var(--panel-border)',fontFamily:'monospace' }}>
              {text_preview.slice(0,400)}{text_preview.length>400?'...':''}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function RejectModal({ cert, onConfirm, onClose }) {
  const [reason, setReason] = useState('')
  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',zIndex:2000,
      display:'flex',alignItems:'center',justifyContent:'center',padding:24 }}>
      <div style={{ background:'var(--panel)',border:'1px solid var(--panel-border)',
        borderRadius:20,padding:32,width:'100%',maxWidth:460 }}>
        <h3 style={{ margin:'0 0 6px',fontSize:18,fontWeight:800 }}>❌ Reject Certificate</h3>
        <p style={{ color:'var(--text-muted)',fontSize:13,marginBottom:18 }}>
          Rejecting <strong>{cert.certificateName}</strong> submitted by <strong>{cert.employeeName}</strong>.
        </p>
        <label style={{ fontSize:12,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.06em',display:'block',marginBottom:6 }}>
          Reason (optional)
        </label>
        <textarea value={reason} onChange={e=>setReason(e.target.value)}
          placeholder="Explain why the certificate is being rejected..."
          style={{ width:'100%',minHeight:90,background:'var(--bg3)',border:'1px solid var(--panel-border)',
            borderRadius:11,padding:11,color:'var(--text)',fontSize:13,resize:'vertical',boxSizing:'border-box',outline:'none' }}/>
        <div style={{ display:'flex',gap:10,marginTop:20 }}>
          <button onClick={onClose} style={{ flex:1,padding:'12px',borderRadius:12,border:'1px solid var(--panel-border)',
            background:'none',color:'var(--text-muted)',cursor:'pointer',fontWeight:600 }}>Cancel</button>
          <button onClick={()=>onConfirm(reason)} style={{ flex:1,padding:'12px',borderRadius:12,
            background:'#ef4d6a',border:'none',color:'#fff',cursor:'pointer',fontWeight:700,fontSize:14 }}>
            ❌ Confirm Reject
          </button>
        </div>
      </div>
    </div>
  )
}

// STAT CARD COMPONENT
function StatCard({ label, value, icon, color, active, onClick }) {
  return (
    <div onClick={onClick} style={{
      background:active?`${color}18`:'var(--panel)',
      border:`2px solid ${active?color:'var(--panel-border)'}`,
      borderRadius:16, padding:'20px 22px', cursor:'pointer',
      transition:'all 0.2s', display:'flex', flexDirection:'column', gap:6,
      boxShadow: active?`0 4px 20px ${color}25`:'none',
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div style={{ fontSize:12, fontWeight:700, color:active?color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{label}</div>
        <div style={{ width:38,height:38,borderRadius:10,background:`${color}18`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18 }}>{icon}</div>
      </div>
      <div style={{ fontSize:32, fontWeight:900, color:active?color:color, letterSpacing:'-1px' }}>{value}</div>
      <div style={{ fontSize:11,color:'var(--text-muted)' }}>
        {active?'Click to show all':'Click to filter'}
      </div>
    </div>
  )
}

export default function Certifications() {
  const [certs, setCerts]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState('All')
  const [search, setSearch]         = useState('')
  const [analyzing, setAnalyzing]   = useState(null)
  const [acting, setActing]         = useState(null)
  const [analysisModal, setAnalysisModal] = useState(null)
  const [pdfModal, setPdfModal]     = useState(null)
  const [rejectModal, setRejectModal] = useState(null)
  const [toast, setToast]           = useState(null)

  const showToast = (msg, type='success') => {
    setToast({ msg, type })
    setTimeout(()=>setToast(null), 3800)
  }

  const load = async () => {
    setLoading(true)
    try { setCerts(await certificationAPI.getAll()) }
    catch { setCerts([]) }
    setLoading(false)
  }

  useEffect(()=>{ load() },[])

  const filtered = certs.filter(c=>{
    const matchFilter = filter==='All'||c.status===filter
    const q = search.toLowerCase()
    const matchSearch = !q||
      c.employeeName?.toLowerCase().includes(q)||
      c.certificateName?.toLowerCase().includes(q)||
      c.courseName?.toLowerCase().includes(q)
    return matchFilter && matchSearch
  })

  const stats = {
    total:    certs.length,
    pending:  certs.filter(c=>c.status==='Pending').length,
    approved: certs.filter(c=>c.status==='Approved').length,
    rejected: certs.filter(c=>c.status==='Rejected').length,
  }

  const handleAnalyze = async (cert) => {
    if (cert.analysisResult) { setAnalysisModal(cert.analysisResult); return }
    setAnalyzing(cert.id)
    try {
      const res = await certificationAPI.analyze(cert.id)
      showToast(res.analysisSource === 'form-data' ? '🔍 Analysis complete from certificate details.' : '🔍 Analysis complete!')
      setAnalysisModal(res.analysis)
      load()
    } catch(e) {
      showToast('Analysis failed: ' + e.message,'error')
    }
    setAnalyzing(null)
  }

  const handleApprove = async (cert) => {
    setActing(cert.id)
    try {
      await certificationAPI.approve(cert.id)
      showToast('✅ Approved! Certificate & skills added to employee profile.')
      load()
    } catch(e) {
      showToast('Approval failed: '+e.message,'error')
    }
    setActing(null)
  }

  const handleRejectConfirm = async (reason) => {
    if (!rejectModal) return
    setActing(rejectModal.id)
    setRejectModal(null)
    try {
      await certificationAPI.reject(rejectModal.id, reason)
      showToast('Certificate rejected.')
      load()
    } catch {
      showToast('Rejection failed.','error')
    }
    setActing(null)
  }

  const handleViewPDF = async (cert) => {
    try {
      const res = await certificationAPI.getPDF(cert.id)
      if (!res.pdfBase64) {
        showToast(res.message || 'No PDF attached for this certificate.','error')
        return
      }
      setPdfModal({ pdfBase64:res.pdfBase64, fileName:res.fileName })
    } catch (e) {
      showToast('Could not load PDF: ' + e.message,'error')
    }
  }

  const STAT_CARDS = [
    { key:'All',      label:'Total',    value:stats.total,    icon:'📋', color:'#8B5CF6' },
    { key:'Pending',  label:'Pending',  value:stats.pending,  icon:'⏳', color:'#ff9f43' },
    { key:'Approved', label:'Approved', value:stats.approved, icon:'✅', color:'#00c896' },
    { key:'Rejected', label:'Rejected', value:stats.rejected, icon:'❌', color:'#ef4d6a' },
  ]

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed',top:24,right:24,zIndex:9999,
          padding:'13px 20px',borderRadius:13,fontWeight:600,fontSize:14,
          background:toast.type==='error'?'#ef4d6a':'#00c896',color:'#fff',
          boxShadow:'0 8px 32px rgba(0,0,0,0.35)',animation:'_toastIn 0.3s ease' }}>
          {toast.type==='error'?'⚠️':'✅'} {toast.msg}
        </div>
      )}

      {analysisModal && <AnalysisModal result={analysisModal} onClose={()=>setAnalysisModal(null)}/>}
      {pdfModal      && <PDFModal {...pdfModal} onClose={()=>setPdfModal(null)}/>}
      {rejectModal   && <RejectModal cert={rejectModal} onConfirm={handleRejectConfirm} onClose={()=>setRejectModal(null)}/>}

      {/* Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Certifications 🎓</h1>
            <p>Review, analyze and approve employee certificate submissions</p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={load}>🔄 Refresh</button>
        </div>
      </div>

      {/* STAT CARDS — proper design with 4 columns */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:28 }}>
        {STAT_CARDS.map(s=>(
          <StatCard
            key={s.key}
            label={s.label}
            value={s.value}
            icon={s.icon}
            color={s.color}
            active={filter===s.key}
            onClick={()=>setFilter(s.key)}
          />
        ))}
      </div>

      {/* Active filter indicator */}
      {filter !== 'All' && (
        <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:16 }}>
          <span style={{ fontSize:13,color:'var(--text-muted)' }}>Showing:</span>
          <span style={{ padding:'4px 12px',borderRadius:20,background:'rgba(139,92,246,0.15)',color:'#8B5CF6',fontSize:12,fontWeight:700 }}>
            {filter}
          </span>
          <button onClick={()=>setFilter('All')} style={{ fontSize:11,color:'var(--text-muted)',background:'none',border:'none',cursor:'pointer',textDecoration:'underline' }}>
            Clear filter
          </button>
        </div>
      )}

      {/* Filters + Search */}
      <div style={{ display:'flex',gap:12,marginBottom:20,flexWrap:'wrap',alignItems:'center' }}>
        <input className="form-control" placeholder="🔍 Search by employee or certificate name..."
          value={search} onChange={e=>setSearch(e.target.value)}
          style={{ flex:1,minWidth:220,maxWidth:400 }}/>
        <div style={{ display:'flex',gap:6 }}>
          {['All','Pending','Approved','Rejected'].map(f=>(
            <button key={f} onClick={()=>setFilter(f)}
              className={`btn btn-sm ${filter===f?'btn-primary':'btn-ghost'}`}>{f}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding:0,overflow:'hidden' }}>
        {loading?(
          <div style={{ padding:'60px 0',textAlign:'center',color:'var(--text-muted)' }}>
            <div style={{ fontSize:36,marginBottom:12 }}>⏳</div>
            <div>Loading certificates...</div>
          </div>
        ):filtered.length===0?(
          <div style={{ padding:'70px 20px',textAlign:'center',color:'var(--text-muted)' }}>
            <div style={{ fontSize:48,marginBottom:14 }}>🎓</div>
            <div style={{ fontWeight:700,fontSize:16,marginBottom:6 }}>No Certificates Found</div>
            <div style={{ fontSize:13 }}>
              {certs.length===0
                ?'When employees submit certificates from the Employee Portal, they will appear here.'
                :'No results match your current filter.'}
            </div>
          </div>
        ):(
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%',borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'var(--bg3)',borderBottom:'1px solid var(--panel-border)' }}>
                  {['Employee','Certificate','Course','Skills','File','Status','Submitted','Actions'].map(h=>(
                    <th key={h} style={{ padding:'13px 16px',textAlign:'left',fontSize:11,
                      fontWeight:800,letterSpacing:'0.08em',textTransform:'uppercase',
                      color:'var(--text-muted)',whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(cert=>(
                  <tr key={cert.id}
                    style={{ borderBottom:'1px solid var(--panel-border)',transition:'background 0.15s' }}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--bg3)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>

                    <td style={{ padding:'14px 16px',whiteSpace:'nowrap' }}>
                      <div style={{ fontWeight:700,fontSize:14 }}>{cert.employeeName}</div>
                      <div style={{ fontSize:11,color:'var(--text-muted)' }}>ID: {cert.employeeId}</div>
                    </td>

                    <td style={{ padding:'14px 16px',maxWidth:200 }}>
                      <div style={{ fontWeight:600,fontSize:13,lineHeight:1.4 }}>{cert.certificateName}</div>
                    </td>

                    <td style={{ padding:'14px 16px',maxWidth:160 }}>
                      <div style={{ fontSize:12,color:'var(--text-soft)' }}>{cert.courseName||'—'}</div>
                    </td>

                    <td style={{ padding:'14px 16px',maxWidth:200 }}>
                      {cert.codeSkills?(
                        <div style={{ display:'flex',flexWrap:'wrap',gap:4 }}>
                          {cert.codeSkills.split(',').slice(0,3).map(sk=>(
                            <span key={sk} style={{ padding:'2px 8px',borderRadius:20,fontSize:10,fontWeight:600,
                              background:'rgba(139,92,246,0.15)',color:'#8B5CF6' }}>{sk.trim()}</span>
                          ))}
                          {cert.codeSkills.split(',').length>3 &&
                            <span style={{ fontSize:10,color:'var(--text-muted)' }}>+{cert.codeSkills.split(',').length-3}</span>}
                        </div>
                      ):<span style={{ fontSize:12,color:'var(--text-muted)' }}>—</span>}
                      {cert.analysisResult?.skills_detected?.length>0 && (
                        <div style={{ fontSize:10,color:'#00c896',marginTop:4 }}>
                          🎯 +{cert.analysisResult.skills_detected.length} AI-detected
                        </div>
                      )}
                    </td>

                    <td style={{ padding:'14px 16px',whiteSpace:'nowrap' }}>
                      {cert.fileName
                        ?<button className="btn btn-ghost btn-sm" style={{ fontSize:11 }}
                            onClick={()=>handleViewPDF(cert)}>📄 View PDF</button>
                        :<span style={{ color:'var(--text-muted)',fontSize:12 }}>No file</span>}
                    </td>

                    <td style={{ padding:'14px 16px',whiteSpace:'nowrap' }}>
                      <StatusBadge status={cert.status}/>
                      {cert.analysisResult && (
                        <div style={{ marginTop:5 }}>
                          <span style={{ fontSize:10,padding:'2px 7px',borderRadius:8,
                            background:'rgba(59,130,246,0.12)',color:'#60a5fa' }}>
                            {cert.analysisResult.verdict_icon} {cert.analysisResult.authenticity_score}%
                          </span>
                        </div>
                      )}
                    </td>

                    <td style={{ padding:'14px 16px',whiteSpace:'nowrap' }}>
                      <div style={{ fontSize:12,color:'var(--text-muted)' }}>
                        {cert.submittedAt
                          ?new Date(cert.submittedAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})
                          :'—'}
                      </div>
                    </td>

                    <td style={{ padding:'14px 16px' }}>
                      <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
                        {cert.fileName && (
                          <button
                            disabled={analyzing===cert.id}
                            onClick={()=>handleAnalyze(cert)}
                            style={{ padding:'5px 10px',fontSize:11,fontWeight:600,cursor:'pointer',
                              borderRadius:8,border:'1px solid var(--panel-border)',
                              background:cert.analysisResult?'rgba(59,130,246,0.12)':'var(--bg3)',
                              color:cert.analysisResult?'#60a5fa':'var(--text-soft)',whiteSpace:'nowrap' }}>
                            {analyzing===cert.id?'⏳ Analyzing…'
                              :cert.analysisResult?'🔍 View Analysis'
                              :'🔍 Analyze'}
                          </button>
                        )}
                        {cert.status!=='Approved' && (
                          <button
                            disabled={acting===cert.id}
                            onClick={()=>handleApprove(cert)}
                            style={{ padding:'5px 10px',fontSize:11,fontWeight:700,cursor:'pointer',
                              borderRadius:8,border:'none',background:'#00c896',color:'#fff',
                              opacity:acting===cert.id?0.6:1,whiteSpace:'nowrap' }}>
                            {acting===cert.id?'⏳':'✅ Approve'}
                          </button>
                        )}
                        {cert.status!=='Rejected' && (
                          <button
                            onClick={()=>setRejectModal(cert)}
                            style={{ padding:'5px 10px',fontSize:11,fontWeight:700,cursor:'pointer',
                              borderRadius:8,border:'none',background:'#ef4d6a',color:'#fff',whiteSpace:'nowrap' }}>
                            ❌ Reject
                          </button>
                        )}
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
