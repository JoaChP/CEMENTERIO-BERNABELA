const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

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

export const api = {
  currentAdmin: () => request('/api/auth/me'),
  login: (username, password) => request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  listDeceased: ({ search = '', page = 1, pageSize = 10 }) => {
    const params = new URLSearchParams({ search, page: String(page), page_size: String(pageSize) })
    return request(`/api/deceased?${params}`)
  },
  getDeceased: (id) => request(`/api/deceased/${encodeURIComponent(id)}`),
  createDeceased: (data) => request('/api/deceased', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateDeceased: (id, data) => request(`/api/deceased/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
}
