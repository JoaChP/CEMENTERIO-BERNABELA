const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : '')).replace(/\/$/, '')

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })

  if (response.status === 204) return null
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const detail = payload?.detail
    const message = typeof detail === 'string'
      ? detail
      : Array.isArray(detail)
        ? detail.map((item) => item.msg).join('. ')
        : 'No se pudo completar la solicitud. Intentá nuevamente.'
    throw new Error(message)
  }
  return payload
}

function filterParams(filters = {}) {
  return new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== '' && value != null))
}

export const api = {
  downloadRecordsPdf: async (filters = {}) => {
    const response = await fetch(`${API_URL}/api/deceased/export/pdf?${filterParams(filters)}`, { credentials: 'include' })
    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      throw new Error(typeof payload?.detail === 'string' ? payload.detail : 'No se pudo descargar el PDF. Intentá nuevamente.')
    }
    const url = URL.createObjectURL(await response.blob())
    const link = document.createElement('a')
    link.href = url
    link.download = Object.values(filters).some(Boolean) ? 'registros-filtrados.pdf' : 'todos-los-registros.pdf'
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  },
  lookupIdentity: (cedula) => request(`/api/identity?${new URLSearchParams({ cedula })}`),
  currentAdmin: () => request('/api/auth/me'),
  login: (username, password) => request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  listDeceased: ({ page = 1, pageSize = 10, ...filters }) => {
    const params = filterParams({ ...filters, page: String(page), page_size: String(pageSize) })
    return request(`/api/deceased?${params}`)
  },
  getDeceased: (id) => request(`/api/deceased/${encodeURIComponent(id)}`),
  mapRecords: () => request('/api/deceased/map/records'),
  deleteDeceased: (id) => request(`/api/deceased/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  createDeceased: (data) => request('/api/deceased', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateDeceased: (id, data) => request(`/api/deceased/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
}
