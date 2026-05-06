/**
 * api.js  –  SPA Admin Portal
 */
const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace(/\/$/, '')

function getToken() {
  try { return localStorage.getItem('spa_token') || '' } catch { return '' }
}

function authHeaders(extra = {}) {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  }
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  })
  let body
  try { body = await res.json() } catch { body = {} }
  if (!res.ok) {
    const msg = body?.message || body?.error || `HTTP ${res.status}`
    if (res.status === 401 && /missing|invalid|expired|authorization/i.test(String(msg))) {
      throw new Error('Login session expired or token missing. Please login again.')
    }
    throw new Error(msg)
  }
  return body
}

function normalizeEmployee(emp) {
  return {
    ...emp,
    department: emp.department || emp.dept || 'General',
    phone: emp.phone || emp.mobile || '',
    joinDate: emp.joinDate || emp.join_date || emp.doj || '',
    availability: emp.availability || 'Available',
    experience: Number(emp.experience || 0),
    currentProjects: Number(emp.currentProjects || 0),
    pastPerformance: Number(emp.pastPerformance || emp.score || 75),
    score: Number(emp.score || emp.pastPerformance || 75),
    skills: Array.isArray(emp.skills) ? emp.skills : [],
    certifications: Array.isArray(emp.certifications) ? emp.certifications : [],
    dob: emp.dob || '',
    father: emp.father || '',
    mother: emp.mother || '',
    address: emp.address || '',
    country: emp.country || '',
    countryCode: emp.countryCode || '',
    state: emp.state || '',
    stateCode: emp.stateCode || '',
    city: emp.city || '',
    imagePreview: emp.imagePreview || '',
  }
}

function normalizeProject(project) {
  return {
    ...project,
    completion: Number(project.completion ?? project.progress ?? 0),
    progress: Number(project.progress ?? project.completion ?? 0),
    deadline: project.deadline || project.endDate || '',
    endDate: project.endDate || project.deadline || '',
    startDate: project.startDate || project.start_date || '',
    status: project.status || 'Pending',
    tech: Array.isArray(project.tech) ? project.tech : [],
    assignedEmployees: Array.isArray(project.assignedEmployees) ? project.assignedEmployees : [],
    head: typeof project.head === 'string' ? project.head : project.head?.name || 'TBD',
    budget: Number(project.budget || 0),
    spent: Number(project.spent || 0),
    teamSize: Number(project.teamSize || project.team_size || 1),
    tasks: Array.isArray(project.tasks) ? project.tasks : [],
    milestones: Array.isArray(project.milestones) ? project.milestones : [],
    aiSummary: project.aiSummary || '',
    riskLevel: project.riskLevel || 'Medium',
    workloadInsights: project.workloadInsights || null,
    allocationSnapshot: project.allocationSnapshot || null,
  }
}

export const authAPI = {
  async login(username, password) {
    return await apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) })
  },
  async signup() {
    throw new Error('Admin account creation is disabled for security. Use backend environment variables.')
  },
  async logout() {
    localStorage.removeItem('spa_token')
    localStorage.removeItem('spa_user')
    return { success: true }
  },
  async getSessionUser() {
    const token = getToken()
    if (!token) return null
    try { return await apiFetch('/api/auth/me') } catch { return null }
  },
}

export const employeeAPI = {
  async getAll() { const data = await apiFetch('/api/employees'); return Array.isArray(data) ? data.map(normalizeEmployee) : [] },
  async getOne(id) { return normalizeEmployee(await apiFetch(`/api/employees/${id}`)) },
  async getStats() { return await apiFetch('/api/employees/stats') },
  async create(payload) { return normalizeEmployee(await apiFetch('/api/employees', { method: 'POST', body: JSON.stringify(normalizeEmployee(payload)) })) },
  async update(id, payload) { return normalizeEmployee(await apiFetch(`/api/employees/${id}`, { method: 'PUT', body: JSON.stringify(normalizeEmployee(payload)) })) },
  async remove(id) { return await apiFetch(`/api/employees/${id}`, { method: 'DELETE' }) },
}

export const projectAPI = {
  async getAll() { const data = await apiFetch('/api/projects'); return Array.isArray(data) ? data.map(normalizeProject) : [] },
  async getOne(id) { return normalizeProject(await apiFetch(`/api/projects/${id}`)) },
  async getStats() { return await apiFetch('/api/projects/stats') },
  async getAnalysis(id) { return await apiFetch(`/api/projects/${id}/analysis`) },
  async create(payload) { return normalizeProject(await apiFetch('/api/projects', { method: 'POST', body: JSON.stringify(normalizeProject(payload)) })) },
  async update(id, payload) { return normalizeProject(await apiFetch(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify(normalizeProject(payload)) })) },
  async remove(id) { return await apiFetch(`/api/projects/${id}`, { method: 'DELETE' }) },
}

export const allocationAPI = {
  async run(payload = {}) { return await apiFetch('/api/allocation/run', { method: 'POST', body: JSON.stringify(payload) }) },
  async history() { return await apiFetch('/api/allocation/history') },
}

export const pdfAPI = {
  async analyze(file) {
    const token = getToken()
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${BASE_URL}/api/pdf/analyze`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: form })
    let body
    try { body = await res.json() } catch { body = {} }
    if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`)
    return {
      filename: file?.name || 'project.pdf',
      text: body.text || '',
      extractedSkills: body.skills || [],
      projectName: file?.name?.replace(/\.pdf$/i, '') || 'AI Project',
      summary: body.skills?.length ? `Detected ${body.skills.length} skills: ${body.skills.join(', ')}` : 'No skills detected. Add skills manually for best allocation.',
      wordCount: body.wordCount || 0,
      skills: body.skills || [],
    }
  },
}

export const healthAPI = {
  async check() {
    try { return { ok: true, mode: 'mongodb', details: await apiFetch('/api/health') } }
    catch (err) { return { ok: false, mode: 'offline', details: err.message } }
  },
}

export const certificationAPI = {
  async getAll() { return await apiFetch('/api/certifications') },
  async getByEmployee(empId) { return await apiFetch(`/api/certifications/employee/${empId}`) },
  async analyze(certId) { return await apiFetch(`/api/certifications/${certId}/analyze`, { method: 'POST', body: '{}' }) },
  async approve(certId) { return await apiFetch(`/api/certifications/${certId}/approve`, { method: 'POST', body: '{}' }) },
  async reject(certId, reason = '') { return await apiFetch(`/api/certifications/${certId}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }) },
  async getPDF(certId) { return await apiFetch(`/api/certifications/${certId}/pdf`) },
  async upload(formData) {
    const token = getToken()
    const res = await fetch(`${BASE_URL}/api/certifications/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })
    let body
    try { body = await res.json() } catch { body = {} }
    if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`)
    return body
  },
}

export const staffIdAPI = {
  async getCredentials(empId) { return await apiFetch(`/api/staff-id/${empId}`) },
  async generate(employeeId) { return await apiFetch('/api/staff-id/generate', { method: 'POST', body: JSON.stringify({ employeeId }) }) },
}
