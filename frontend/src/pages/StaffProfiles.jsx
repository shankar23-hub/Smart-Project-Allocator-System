import { useState, useEffect, useRef } from 'react'
import { Country, State, City } from 'country-state-city'
import { employeeAPI } from '../utils/api'
import './StaffProfiles.css'

const DEPARTMENTS = ['Engineering', 'Design', 'HR', 'Finance', 'Marketing', 'Operations', 'Sales', 'Support']
const ROLES = ['Software Engineer', 'Senior Developer', 'UI/UX Designer', 'HR Manager', 'Project Manager', 'Team Lead', 'Business Analyst', 'QA Engineer', 'DevOps Engineer', 'Data Scientist']

const EMPTY_FORM = {
  name: '', role: '', email: '', mobile: '', dept: '', dob: '', doj: '',
  father: '', mother: '', address: '',
  country: '', countryCode: '', state: '', stateCode: '', city: '',
  skills: [], skillsInput: '', experience: '',
  certifications: [], availability: 'Available',
  pastPerformance: 75, currentProjects: 0, score: 75,
  image: null, imagePreview: null,
}

/* ---------------- STAFF MODAL ---------------- */
function StaffModal({ staff, onClose, onSave }) {
  const [form, setForm] = useState(staff ? { ...EMPTY_FORM, ...staff } : EMPTY_FORM)
  const fileRef = useRef()
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const countries = Country.getAllCountries()
  const selectedCountryCode = form.countryCode || countries.find(c => c.name === form.country)?.isoCode || ''
  const states = selectedCountryCode ? State.getStatesOfCountry(selectedCountryCode) : []
  const selectedStateCode = form.stateCode || states.find(s => s.name === form.state)?.isoCode || ''
  const cities = selectedCountryCode && selectedStateCode ? City.getCitiesOfState(selectedCountryCode, selectedStateCode) : []

  const handleCountryChange = (countryCode) => {
    const country = countries.find(c => c.isoCode === countryCode)
    setForm(f => ({ ...f, country: country?.name || '', countryCode: country?.isoCode || '', state: '', stateCode: '', city: '' }))
  }

  const handleStateChange = (stateCode) => {
    const state = states.find(s => s.isoCode === stateCode)
    setForm(f => ({ ...f, state: state?.name || '', stateCode: state?.isoCode || '', city: '' }))
  }

  const handleImage = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => set('imagePreview', ev.target.result)
    reader.readAsDataURL(file)
  }

  const addSkill = () => {
    const value = (form.skillsInput || '').trim()
    if (!value) return
    if ((form.skills || []).some(s => s.toLowerCase() === value.toLowerCase())) return
    setForm(f => ({ ...f, skills: [...(f.skills || []), value], skillsInput: '' }))
  }

  const removeSkill = (skill) => {
    setForm(f => ({ ...f, skills: (f.skills || []).filter(s => s !== skill) }))
  }

  return (
    <div className="sp-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sp-modal">
        {/* Header */}
        <div className="sp-modal-header">
          <div className="sp-modal-title">
            <span className="sp-modal-title-icon">{staff ? '✏️' : '➕'}</span>
            <div>
              <h2>{staff ? 'Edit Staff Profile' : 'Add New Staff Member'}</h2>
              <p>{staff ? 'Update the staff information below' : 'Fill in the details to onboard a new member'}</p>
            </div>
          </div>
          <button className="sp-icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="sp-modal-body">
          {/* Photo upload card */}
          <div className="sp-photo-card">
            <div className="sp-photo-frame" onClick={() => fileRef.current?.click()}>
              {form.imagePreview ? (
                <img src={form.imagePreview} alt="avatar" />
              ) : (
                <div className="sp-photo-placeholder">
                  <span>📷</span>
                  <small>Click to upload</small>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleImage} />
            <div className="sp-photo-info">
              <div className="sp-photo-name">{form.name || 'Staff Member'}</div>
              <div className="sp-photo-role">{form.role || 'Role not selected'}</div>
              <div className="sp-photo-actions">
                <button type="button" className="sp-btn sp-btn-outline sp-btn-sm" onClick={() => fileRef.current?.click()}>
                  📁 Upload Photo
                </button>
                {form.imagePreview && (
                  <button type="button" className="sp-btn sp-btn-ghost sp-btn-sm" onClick={() => set('imagePreview', null)}>
                    ✕ Remove
                  </button>
                )}
              </div>
              <div className="sp-photo-hint">JPG or PNG · Max 5 MB</div>
            </div>
          </div>

          {/* Personal Information */}
          <section className="sp-section">
            <header className="sp-section-header">
              <span className="sp-section-dot" />
              <h3>Personal Information</h3>
            </header>
            <div className="sp-grid sp-grid-2">
              <div className="sp-field">
                <label>Full Name <em>*</em></label>
                <input className="sp-input" placeholder="John Doe" value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div className="sp-field">
                <label>Role / Designation <em>*</em></label>
                <select className="sp-input" value={form.role} onChange={e => set('role', e.target.value)}>
                  <option value="">Select Role</option>
                  {ROLES.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="sp-field">
                <label>Email ID <em>*</em></label>
                <input className="sp-input" type="email" placeholder="john@spa.com" value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div className="sp-field">
                <label>Mobile Number <em>*</em></label>
                <input className="sp-input" placeholder="+91 98765 43210" value={form.mobile} onChange={e => set('mobile', e.target.value)} />
              </div>
              <div className="sp-field">
                <label>Department <em>*</em></label>
                <select className="sp-input" value={form.dept} onChange={e => set('dept', e.target.value)}>
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="sp-field">
                <label>Date of Birth</label>
                <input className="sp-input" type="date" value={form.dob} onChange={e => set('dob', e.target.value)} />
              </div>
              <div className="sp-field">
                <label>Date of Joining</label>
                <input className="sp-input" type="date" value={form.doj} onChange={e => set('doj', e.target.value)} />
              </div>
            </div>
          </section>

          {/* Professional Details */}
          <section className="sp-section">
            <header className="sp-section-header">
              <span className="sp-section-dot" />
              <h3>Professional Details</h3>
            </header>
            <div className="sp-grid sp-grid-2">
              <div className="sp-field">
                <label>Experience (Years)</label>
                <input className="sp-input" type="number" min="0" placeholder="2" value={form.experience} onChange={e => set('experience', e.target.value)} />
              </div>
              <div className="sp-field">
                <label>Skills</label>
                <div className="sp-skill-input">
                  <input
                    className="sp-input"
                    placeholder="Type a skill and press Enter"
                    value={form.skillsInput || ''}
                    onChange={e => set('skillsInput', e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
                  />
                  <button type="button" className="sp-btn sp-btn-outline sp-btn-sm" onClick={addSkill}>Add</button>
                </div>
                {!!form.skills?.length && (
                  <div className="sp-chip-row">
                    {form.skills.map(skill => (
                      <span key={skill} className="sp-chip">
                        {skill}
                        <button type="button" onClick={() => removeSkill(skill)} aria-label={`Remove ${skill}`}>✕</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Family Information */}
          <section className="sp-section">
            <header className="sp-section-header">
              <span className="sp-section-dot" />
              <h3>Family Information</h3>
            </header>
            <div className="sp-grid sp-grid-2">
              <div className="sp-field">
                <label>Father's Name</label>
                <input className="sp-input" placeholder="Father's full name" value={form.father} onChange={e => set('father', e.target.value)} />
              </div>
              <div className="sp-field">
                <label>Mother's Name</label>
                <input className="sp-input" placeholder="Mother's full name" value={form.mother} onChange={e => set('mother', e.target.value)} />
              </div>
            </div>
          </section>

          {/* Address Details */}
          <section className="sp-section">
            <header className="sp-section-header">
              <span className="sp-section-dot" />
              <h3>Address Details</h3>
            </header>
            <div className="sp-field sp-field-full">
              <label>Street Address</label>
              <input className="sp-input" placeholder="House No., Street, Area" value={form.address} onChange={e => set('address', e.target.value)} />
            </div>
            <div className="sp-grid sp-grid-3">
              <div className="sp-field">
                <label>Country</label>
                <select className="sp-input" value={selectedCountryCode} onChange={e => handleCountryChange(e.target.value)}>
                  <option value="">Select Country</option>
                  {countries.map(c => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
                </select>
              </div>
              <div className="sp-field">
                <label>State</label>
                <select className="sp-input" value={selectedStateCode} disabled={!selectedCountryCode} onChange={e => handleStateChange(e.target.value)}>
                  <option value="">Select State</option>
                  {states.map(s => <option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}
                </select>
              </div>
              <div className="sp-field">
                <label>City</label>
                <select className="sp-input" value={form.city || ''} disabled={!selectedStateCode} onChange={e => set('city', e.target.value)}>
                  <option value="">Select City</option>
                  {cities.map(c => <option key={`${c.name}-${c.latitude}-${c.longitude}`} value={c.name}>{c.name}</option>)}
                </select>
              </div>
            </div>
          </section>
        </div>

        {/* Sticky footer */}
        <div className="sp-modal-footer">
          <button className="sp-btn sp-btn-outline" onClick={onClose}>Cancel</button>
          <button className="sp-btn sp-btn-primary" onClick={() => onSave(form)}>
            {staff ? '💾 Update Profile' : '✅ Add Staff Member'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------------- VIEW MODAL ---------------- */
function ViewModal({ staff, onClose, onEdit }) {
  const [photoFull, setPhotoFull] = useState(false)

  const fields = [
    { label: 'Email ID', value: staff.email, icon: '📧' },
    { label: 'Mobile No', value: staff.mobile, icon: '📱' },
    { label: 'Department', value: staff.dept, icon: '🏢' },
    { label: 'Skills', value: (staff.skills || []).length ? staff.skills.join(', ') : 'N/A', icon: '🧠' },
    { label: 'Experience', value: staff.experience !== '' && staff.experience != null ? `${staff.experience} Years` : 'N/A', icon: '⏳' },
    { label: 'Date of Birth', value: staff.dob || 'N/A', icon: '🎂' },
    { label: 'Date of Joining', value: staff.doj || 'N/A', icon: '📅' },
    { label: 'Father Name', value: staff.father || 'N/A', icon: '👨' },
    { label: 'Mother Name', value: staff.mother || 'N/A', icon: '👩' },
    { label: 'Address', value: staff.address || 'N/A', icon: '📍' },
    { label: 'Country', value: staff.country || 'N/A', icon: '🌍' },
    { label: 'State', value: staff.state || 'N/A', icon: '🗺️' },
    { label: 'City', value: staff.city || 'N/A', icon: '🏙️' },
  ]

  return (
    <>
      <div className="sp-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="sp-modal">
          <div className="sp-modal-header">
            <div className="sp-modal-title">
              <span className="sp-modal-title-icon">👤</span>
              <div>
                <h2>Staff Profile</h2>
                <p>Complete information about the staff member</p>
              </div>
            </div>
            <button className="sp-icon-btn" onClick={onClose} aria-label="Close">✕</button>
          </div>

          <div className="sp-modal-body">
            {/* Hero card */}
            <div className="sp-view-hero">
              <div className="sp-view-hero-bg" />
              <div
                className="sp-view-avatar"
                onClick={() => staff.imagePreview && setPhotoFull(true)}
                style={{ cursor: staff.imagePreview ? 'zoom-in' : 'default' }}
              >
                {staff.imagePreview
                  ? <img src={staff.imagePreview} alt={staff.name} />
                  : <span>👤</span>}
              </div>
              <div className="sp-view-hero-info">
                <h2>{staff.name}</h2>
                <p>{staff.role}</p>
                <div className="sp-view-hero-meta">
                  <span className="sp-chip sp-chip-static">🏢 {staff.dept}</span>
                  {staff.availability && <span className="sp-chip sp-chip-static sp-chip-success">● {staff.availability}</span>}
                </div>
              </div>
              <button className="sp-btn sp-btn-outline sp-btn-sm sp-view-edit-btn" onClick={onEdit}>✏️ Edit</button>
            </div>

            {/* Detail grid */}
            <div className="sp-detail-grid">
              {fields.map(f => (
                <div key={f.label} className="sp-detail-item">
                  <div className="sp-detail-label">
                    <span className="sp-detail-icon">{f.icon}</span>
                    {f.label}
                  </div>
                  <div className="sp-detail-value">{f.value}</div>
                </div>
              ))}
            </div>

            {/* Certifications */}
            {(staff.certifications?.length > 0 || staff.approvedCertDocs?.length > 0) && (
              <section className="sp-section">
                <header className="sp-section-header">
                  <span className="sp-section-dot" />
                  <h3>🎓 Certifications</h3>
                </header>
                {staff.certifications?.length > 0 && (
                  <div className="sp-chip-row">
                    {staff.certifications.map(c => (
                      <span key={c} className="sp-chip sp-chip-success">{c}</span>
                    ))}
                  </div>
                )}
                {staff.approvedCertDocs?.length > 0 && (
                  <div className="sp-doc-list">
                    <div className="sp-doc-list-title">APPROVED DOCUMENTS</div>
                    {staff.approvedCertDocs.map((doc, i) => (
                      <div key={i} className="sp-doc-item">
                        <span className="sp-doc-icon">📄</span>
                        <div className="sp-doc-meta">
                          <div className="sp-doc-name">{doc.name}</div>
                          {doc.approvedAt && (
                            <div className="sp-doc-date">Approved · {new Date(doc.approvedAt).toLocaleDateString('en-IN')}</div>
                          )}
                        </div>
                        <span className="sp-chip sp-chip-success sp-chip-static">✅ Verified</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>

          <div className="sp-modal-footer">
            <button className="sp-btn sp-btn-outline" onClick={onClose}>Close</button>
            <button className="sp-btn sp-btn-primary" onClick={onEdit}>✏️ Edit Profile</button>
          </div>
        </div>
      </div>

      {photoFull && (
        <div className="sp-photo-full" onClick={() => setPhotoFull(false)}>
          <img src={staff.imagePreview} alt={staff.name} />
          <button className="sp-photo-full-close" onClick={() => setPhotoFull(false)}>✕</button>
        </div>
      )}
    </>
  )
}

/* ---------------- HELPERS ---------------- */
function normalizeEmp(e) {
  return {
    ...e,
    dept: e.department || e.dept || '',
    mobile: e.phone || e.mobile || '',
    dob: e.dob || '',
    doj: e.joinDate || e.join_date || e.doj || '',
    father: e.father || '',
    mother: e.mother || '',
    address: e.address || '',
    country: e.country || '',
    countryCode: e.countryCode || '',
    state: e.state || '',
    stateCode: e.stateCode || '',
    city: e.city || '',
    imagePreview: e.imagePreview || null,
    skills: Array.isArray(e.skills) ? e.skills : [],
    skillsInput: '',
    experience: e.experience ?? '',
    certifications: Array.isArray(e.certifications) ? e.certifications : [],
    availability: e.availability || 'Available',
    pastPerformance: e.pastPerformance ?? 75,
    currentProjects: e.currentProjects ?? 0,
    score: e.score ?? 75,
  }
}

/* ---------------- MAIN PAGE ---------------- */
export default function StaffProfiles() {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [viewing, setViewing] = useState(null)
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('All')

  useEffect(() => {
    employeeAPI.getAll()
      .then(data => { setStaff(data.map(normalizeEmp)); setLoading(false) })
      .catch(() => { setStaff([]); setLoading(false) })
  }, [])

  const filtered = staff.filter(s => {
    const q = search.toLowerCase()
    const matchQ = !q
      || s.name.toLowerCase().includes(q)
      || s.email.toLowerCase().includes(q)
      || s.role.toLowerCase().includes(q)
      || (s.skills || []).some(sk => sk.toLowerCase().includes(q))
    const matchD = filterDept === 'All' || s.dept === filterDept
    return matchQ && matchD
  })

  const handleSave = async (form) => {
    const payload = {
      name: form.name,
      role: form.role,
      email: form.email,
      phone: form.mobile,
      department: form.dept,
      dob: form.dob || '',
      father: form.father || '',
      mother: form.mother || '',
      address: form.address || '',
      country: form.country || '',
      countryCode: form.countryCode || '',
      state: form.state || '',
      stateCode: form.stateCode || '',
      city: form.city || '',
      imagePreview: form.imagePreview || '',
      skills: form.skills || [],
      certifications: form.certifications || [],
      experience: Number(form.experience || 0),
      availability: form.availability || 'Available',
      pastPerformance: Number(form.pastPerformance || 75),
      currentProjects: Number(form.currentProjects || 0),
      score: Number(form.score || 75),
      avatar: form.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
      joinDate: form.doj || '',
    }
    try {
      if (editing) {
        const updated = await employeeAPI.update(editing.id, payload)
        setStaff(s => s.map(x => x.id === editing.id ? normalizeEmp(updated) : x))
        setEditing(null)
      } else {
        const created = await employeeAPI.create(payload)
        setStaff(s => [...s, normalizeEmp(created)])
        setShowAdd(false)
      }
    } catch (err) {
      alert('Failed to save employee: ' + err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this staff member?')) return
    setStaff(st => st.filter(x => x.id !== id))
    try { await employeeAPI.remove(id) } catch { /**/ }
  }

  const departments = [...new Set(staff.map(s => s.dept).filter(Boolean))]

  return (
    <div className="sp-page">
      {/* Page header */}
      <div className="sp-page-header">
        <div className="sp-page-header-text">
          <h1>Staff Profiles <span className="sp-wave">👥</span></h1>
          <p>{staff.length} {staff.length === 1 ? 'employee' : 'employees'} across {departments.length} {departments.length === 1 ? 'department' : 'departments'}</p>
        </div>
        <button className="sp-btn sp-btn-primary" onClick={() => setShowAdd(true)}>
          <span>➕</span> Add Staff
        </button>
      </div>

      {/* Filter bar */}
      <div className="sp-filter-bar">
        <div className="sp-search">
          <span className="sp-search-icon">🔍</span>
          <input
            placeholder="Search by name, email, role or skill…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="sp-tabs">
          {['All', ...DEPARTMENTS.slice(0, 5)].map(d => (
            <button
              key={d}
              className={`sp-tab ${filterDept === d ? 'active' : ''}`}
              onClick={() => setFilterDept(d)}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="sp-empty">
          <div className="sp-empty-icon">⏳</div>
          <h3>Loading Staff…</h3>
          <p>Fetching team members</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="sp-empty">
          <div className="sp-empty-icon">🔍</div>
          <h3>No Staff Found</h3>
          <p>Try adjusting your search or add the first profile</p>
          <button className="sp-btn sp-btn-primary" onClick={() => setShowAdd(true)}>➕ Add Staff</button>
        </div>
      ) : (
        <div className="sp-card-grid">
          {filtered.map(s => (
            <div key={s.id} className="sp-card" onClick={() => setViewing(s)}>
              <div className="sp-card-cover" />
              <div className="sp-card-body">
                <div className="sp-card-head">
                  <div className="sp-card-avatar">
                    {s.imagePreview
                      ? <img src={s.imagePreview} alt={s.name} />
                      : <span>{(s.name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}</span>}
                  </div>
                  <div className="sp-card-titles">
                    <div className="sp-card-name">{s.name}</div>
                    <div className="sp-card-role">{s.role}</div>
                    <span className="sp-chip sp-chip-static">{s.dept}</span>
                  </div>
                </div>

                <ul className="sp-card-info">
                  <li><span>📧</span><span className="sp-truncate">{s.email}</span></li>
                  <li><span>📱</span><span>{s.mobile}</span></li>
                  {!!s.skills?.length && (
                    <li>
                      <span>🧠</span>
                      <span className="sp-truncate">
                        {s.skills.slice(0, 3).join(', ')}{s.skills.length > 3 ? '…' : ''}
                      </span>
                    </li>
                  )}
                  {s.experience !== '' && s.experience != null && (
                    <li><span>⏳</span><span>{s.experience} yrs experience</span></li>
                  )}
                  {s.city && <li><span>📍</span><span className="sp-truncate">{s.city}{s.state ? `, ${s.state}` : ''}</span></li>}
                </ul>

                <div className="sp-card-actions">
                  <button className="sp-btn sp-btn-ghost sp-btn-sm" onClick={e => { e.stopPropagation(); setViewing(s) }}>👁 View</button>
                  <button className="sp-btn sp-btn-outline sp-btn-sm" onClick={e => { e.stopPropagation(); setEditing(s) }}>✏️ Edit</button>
                  <button className="sp-btn sp-btn-danger sp-btn-sm sp-btn-icon" onClick={e => { e.stopPropagation(); handleDelete(s.id) }} aria-label="Delete">🗑</button>
                </div>
              </div>
            </div>
          ))}

          {/* Add new card */}
          <div className="sp-card sp-card-add" onClick={() => setShowAdd(true)}>
            <div className="sp-card-add-icon">➕</div>
            <div className="sp-card-add-title">Add New Staff</div>
            <div className="sp-card-add-hint">Click to create a profile</div>
          </div>
        </div>
      )}

      {(showAdd || editing) && (
        <StaffModal
          staff={editing}
          onClose={() => { setShowAdd(false); setEditing(null) }}
          onSave={handleSave}
        />
      )}
      {viewing && !editing && (
        <ViewModal
          staff={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => { setEditing(viewing); setViewing(null) }}
        />
      )}
    </div>
  )
}