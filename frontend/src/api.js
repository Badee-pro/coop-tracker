const BASE = '/api/job_applications'

async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (res.status === 204) return null
  const data = await res.json()
  if (!res.ok) throw new Error((data.errors || ['Request failed']).join(', '))
  return data
}

export const listApplications = () => request(BASE)

export const createApplication = (job_application) =>
  request(BASE, { method: 'POST', body: JSON.stringify({ job_application }) })

export const updateApplication = (id, job_application) =>
  request(`${BASE}/${id}`, { method: 'PATCH', body: JSON.stringify({ job_application }) })

export const importApplications = (rows) =>
  request(`${BASE}/import`, { method: 'POST', body: JSON.stringify({ rows }) })

export const getSyncStatus = () => request('/api/waterloo_works/status')

export const syncWaterlooWorks = () => request('/api/waterloo_works/sync', { method: 'POST' })

export const cancelWaterlooWorksSync = () => request('/api/waterloo_works/sync/cancel', { method: 'POST' })

export const importWaterlooWorksItems = (items) =>
  request('/api/waterloo_works/import', { method: 'POST', body: JSON.stringify({ items }) })

export const deleteApplication = (id) => request(`${BASE}/${id}`, { method: 'DELETE' })
