/**
 * api.js – SPA Admin Portal
 * Fixed API connector for Vercel Frontend + Vercel Flask Backend.
 *
 * Backend API:
 *   https://smart-project-allocator-system.vercel.app
 *
 * Frontend Vercel env variable:
 *   VITE_API_URL=https://smart-project-allocator-system.vercel.app
 */

const DEFAULT_BACKEND_URL = 'https://smart-project-allocator-system.vercel.app'

const ENV_BACKEND_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  DEFAULT_BACKEND_URL
).trim().replace(/\/$/, '')

const isBrowser = typeof window !== 'undefined'

// Same-origin proxy fallback. frontend/vercel.json rewrites /api/* to the backend.
const PROXY_BASE_URL = ''

export const BASE_URL = ENV_BACKEND_URL

function getToken() {
  try {
    return localStorage.getItem('spa_token') || ''
  } catch {
    return ''
  }
}

function setAuthData(data) {
  try {
    if (data?.token) localStorage.setItem('spa_token', data.token)
    if (data?.user) localStorage.setItem('spa_user', JSON.stringify(data.user))
  } catch {
    // ignore localStorage errors
  }
}

function clearAuthData() {
  try {
    localStorage.removeItem('spa_token')
    localStorage.removeItem('spa_user')
  } catch {
    // ignore localStorage errors
  }
}

function buildUrl(base, path) {
  if (!base) return path
  return `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`
}

function isFormDataBody(body) {
  return isBrowser && typeof FormData !== 'undefined' && body instanceof FormData
}

function buildHeaders(options = {}) {
  const token = getToken()
  const bodyIsFormData = isFormDataBody(options.body)

  return {
    ...(bodyIsFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  }
}

async function parseResponse(res) {
  const contentType = res.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    try {
      return await res.json()
    } catch {
      return {}
    }
  }

  try {
    const text = await res.text()
    return text ? { message: text } : {}
  } catch {
    return {}
  }
}

async function requestOnce(base, path, options = {}) {
  const url = buildUrl(base, path)
  const headers = buildHeaders(options)

  const res = await fetch(url, {
    ...options,
    headers,
    mode: 'cors',
  })

  const body = await parseResponse(res)

  if (!res.ok) {
    const msg = body?.message || body?.error || body?.detail || `HTTP ${res.status}`

    if (res.status === 401) {
      clearAuthData()
      throw new Error(msg || 'Login session expired. Please login again.')
    }

    throw new Error(msg)
  }

  return body
}

export async function apiFetch(path, options = {}) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`

  try {
    return await requestOnce(ENV_BACKEND_URL, cleanPath, options)
  } catch (error) {
    // Browser "Failed to fetch" normally means CORS/preflight/network.
    // On Vercel frontend, retry through same-origin rewrite /api/* → backend.
    const networkError = /failed to fetch|networkerror|load failed/i.test(String(error?.message || error))
    const canUseProxy = isBrowser && cleanPath.startsWith('/api/')

    if (networkError && canUseProxy) {
      try {
        return await requestOnce(PROXY_BASE_URL, cleanPath, options)
      } catch (proxyError) {
        throw new Error(
          `API connection failed. Direct backend and Vercel proxy both failed. Backend: ${ENV_BACKEND_URL}. Details: ${proxyError.message || proxyError}`
        )
      }
    }

    if (networkError) {
      throw new Error(
        `Failed to fetch backend API. Check backend URL, Vercel deployment, and CORS. API URL: ${ENV_BACKEND_URL}`
      )
    }

    throw error
  }
}

function normalizeEmployee(emp = {}) {
  return {
    ...emp,
    department: emp.department || emp.dept || 'General',
    dept: emp.dept || emp.department || 'General',
    phone: emp.phone || emp.mobile || '',
    mobile: emp.mobile || emp.phone || '',
    joinDate: emp.joinDate || emp.join_date || emp.doj || '',
    doj: emp.doj || emp.joinDate || emp.join_date || '',
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
    imagePreview: emp.imagePreview || emp.profileImage || '',
    profileImage: emp.profileImage || emp.imagePreview || '',
  }
}

function normalizeProject(project = {}) {
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
  async login(usernameOrEmail, password) {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: usernameOrEmail,
        email: usernameOrEmail,
        password,
      }),
    })

    setAuthData(data)
    return data
  },

  async signup() {
    throw new Error('Admin account creation is disabled. Use backend environment variables.')
  },

  async logout() {
    clearAuthData()
    return { success: true }
  },

  async getSessionUser() {
    const token = getToken()
    if (!token) return null

    try {
      return await apiFetch('/api/auth/me')
    } catch {
      clearAuthData()
      return null
    }
  },

  async updateProfile(payload) {
    return await apiFetch('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },

  async changePassword(payload) {
    return await apiFetch('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
}

export const employeeAPI = {
  async getAll() {
    const data = await apiFetch('/api/employees')
    return Array.isArray(data) ? data.map(normalizeEmployee) : []
  },

  async getOne(id) {
    return normalizeEmployee(await apiFetch(`/api/employees/${id}`))
  },

  async getStats() {
    return await apiFetch('/api/employees/stats')
  },

  async create(payload) {
    const data = await apiFetch('/api/employees', {
      method: 'POST',
      body: JSON.stringify(normalizeEmployee(payload)),
    })
    return normalizeEmployee(data)
  },

  async update(id, payload) {
    const data = await apiFetch(`/api/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(normalizeEmployee(payload)),
    })
    return normalizeEmployee(data)
  },

  async remove(id) {
    return await apiFetch(`/api/employees/${id}`, { method: 'DELETE' })
  },
}

export const projectAPI = {
  async getAll() {
    const data = await apiFetch('/api/projects')
    return Array.isArray(data) ? data.map(normalizeProject) : []
  },

  async getOne(id) {
    return normalizeProject(await apiFetch(`/api/projects/${id}`))
  },

  async getStats() {
    return await apiFetch('/api/projects/stats')
  },

  async getAnalysis(id) {
    return await apiFetch(`/api/projects/${id}/analysis`)
  },

  async create(payload) {
    const data = await apiFetch('/api/projects', {
      method: 'POST',
      body: JSON.stringify(normalizeProject(payload)),
    })
    return normalizeProject(data)
  },

  async update(id, payload) {
    const data = await apiFetch(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(normalizeProject(payload)),
    })
    return normalizeProject(data)
  },

  async remove(id) {
    return await apiFetch(`/api/projects/${id}`, { method: 'DELETE' })
  },
}

export const allocationAPI = {
  async run(payload = {}) {
    return await apiFetch('/api/allocation/run', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async history() {
    return await apiFetch('/api/allocation/history')
  },

  async sendProjectNotifications(payload = {}) {
    return await apiFetch('/api/allocation/send-project-notifications', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
}

export const pdfAPI = {
  async analyze(file) {
    if (!file) throw new Error('Please select a PDF file.')

    const form = new FormData()
    form.append('file', file)

    const body = await apiFetch('/api/pdf/analyze', {
      method: 'POST',
      body: form,
    })

    return {
      filename: file?.name || 'project.pdf',
      text: body.text || '',
      extractedSkills: body.skills || [],
      projectName: file?.name?.replace(/\.pdf$/i, '') || 'AI Project',
      summary: body.skills?.length
        ? `Detected ${body.skills.length} skills: ${body.skills.join(', ')}`
        : 'No skills detected. Add skills manually for best allocation.',
      wordCount: body.wordCount || 0,
      skills: body.skills || [],
    }
  },
}

export const healthAPI = {
  async check() {
    try {
      const details = await apiFetch('/api/health')
      return { ok: true, mode: 'mongodb', baseUrl: BASE_URL, details }
    } catch (err) {
      return { ok: false, mode: 'offline', baseUrl: BASE_URL, details: err.message }
    }
  },
}

export const certificationAPI = {
  async getAll() {
    return await apiFetch('/api/certifications')
  },

  async getByEmployee(empId) {
    return await apiFetch(`/api/certifications/employee/${empId}`)
  },

  async analyze(certId) {
    return await apiFetch(`/api/certifications/${certId}/analyze`, {
      method: 'POST',
      body: JSON.stringify({}),
    })
  },

  async approve(certId) {
    return await apiFetch(`/api/certifications/${certId}/approve`, {
      method: 'POST',
      body: JSON.stringify({}),
    })
  },

  async reject(certId, reason = '') {
    return await apiFetch(`/api/certifications/${certId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  },

  async getPDF(certId) {
    return await apiFetch(`/api/certifications/${certId}/pdf`)
  },

  async upload(formData) {
    if (!(formData instanceof FormData)) {
      throw new Error('Invalid upload data. FormData required.')
    }

    return await apiFetch('/api/certifications/upload', {
      method: 'POST',
      body: formData,
    })
  },
}

export const staffIdAPI = {
  async getCredentials(empId) {
    return await apiFetch(`/api/staff-id/${empId}`)
  },

  async generate(employeeId) {
    return await apiFetch('/api/staff-id/generate', {
      method: 'POST',
      body: JSON.stringify({ employeeId }),
    })
  },
}

export const notificationAPI = {
  async getAll() {
    return await apiFetch('/api/notifications')
  },

  async markRead(id) {
    return await apiFetch(`/api/notifications/${id}/read`, {
      method: 'PUT',
      body: JSON.stringify({}),
    })
  },

  async remove(id) {
    return await apiFetch(`/api/notifications/${id}`, { method: 'DELETE' })
  },
}

export default {
  BASE_URL,
  apiFetch,
  authAPI,
  employeeAPI,
  projectAPI,
  allocationAPI,
  pdfAPI,
  healthAPI,
  certificationAPI,
  staffIdAPI,
  notificationAPI,
}
