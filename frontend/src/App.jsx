import { useEffect, useMemo, useState } from 'react'
import { STATUSES } from './constants'
import { listApplications, createApplication, updateApplication, deleteApplication } from './api'
import { isClosedPosting } from './format'
import ApplicationsTable from './components/ApplicationsTable'
import Pagination from './components/Pagination'
import ApplicationForm from './components/ApplicationForm'
import ApplicationDetails from './components/ApplicationDetails'
import SyncBar from './components/SyncBar'
import './App.css'

const STATUS_ORDER = Object.fromEntries(STATUSES.map((s, i) => [s.key, i]))

function compare(a, b, key) {
  if (key === 'status') return STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
  const x = a[key] ?? ''
  const y = b[key] ?? ''
  if (x === '' && y !== '') return 1
  if (y === '' && x !== '') return -1
  return String(x).localeCompare(String(y), undefined, { numeric: true, sensitivity: 'base' })
}

export default function App() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(null)
  const [viewing, setViewing] = useState(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [postingFilter, setPostingFilter] = useState('all')
  const [sort, setSort] = useState({ key: 'applied_on', dir: 'desc' })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const load = async () => {
    try {
      setApplications(await listApplications())
      setError(null)
    } catch (err) {
      setError(`Could not reach the API: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 15000)
    window.addEventListener('focus', load)
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', load)
    }
  }, [])

  useEffect(() => setPage(1), [query, statusFilter, postingFilter, pageSize])

  const counts = useMemo(() => {
    const c = Object.fromEntries(STATUSES.map((s) => [s.key, 0]))
    applications.forEach((a) => (c[a.status] = (c[a.status] || 0) + 1))
    return c
  }, [applications])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const rows = applications.filter((a) => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false
      if (postingFilter === 'open' && isClosedPosting(a.job_status)) return false
      if (postingFilter === 'closed' && !isClosedPosting(a.job_status)) return false
      if (!q) return true
      return [a.company, a.role, a.location, a.city, a.term, a.external_id, a.notes, a.division].some((v) =>
        String(v ?? '').toLowerCase().includes(q),
      )
    })
    const dir = sort.dir === 'asc' ? 1 : -1
    return rows.sort((a, b) => compare(a, b, sort.key) * dir || compare(b, a, 'applied_on'))
  }, [applications, query, statusFilter, postingFilter, sort])

  const pages = Math.max(1, Math.ceil(visible.length / pageSize))
  const currentPage = Math.min(page, pages)
  const pageRows = visible.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const total = applications.length
  const submitted = total - counts.wishlist
  const responses = counts.interviewing + counts.offer + counts.rejected
  const responseRate = submitted ? Math.round((responses / submitted) * 100) : 0
  const closedPostings = applications.filter((a) => isClosedPosting(a.job_status)).length

  const toggleSort = (key) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'applied_on' || key === 'deadline_on' ? 'desc' : 'asc' }))

  const save = async (payload) => {
    if (editing?.id) {
      const updated = await updateApplication(editing.id, payload)
      setApplications((list) => list.map((a) => (a.id === updated.id ? updated : a)))
    } else {
      const created = await createApplication(payload)
      setApplications((list) => [created, ...list])
    }
    setEditing(null)
  }

  const remove = async () => {
    if (!window.confirm(`Delete ${editing.company} – ${editing.role}?`)) return
    await deleteApplication(editing.id)
    setApplications((list) => list.filter((a) => a.id !== editing.id))
    setEditing(null)
  }

  const saveNotes = async (id, notes) => {
    const updated = await updateApplication(id, { notes })
    setApplications((list) => list.map((a) => (a.id === id ? updated : a)))
    setViewing(updated)
  }

  const openApplication = (a) => {
    const phone = window.matchMedia('(max-width: 640px)').matches
    if (a.external_id) setViewing(a)
    else if (!phone) setEditing(a)
  }

  const changeStatus = async (id, status) => {
    const current = applications.find((a) => a.id === id)
    if (!current || current.status === status) return
    const patch = { status }
    if (status === 'applied' && !current.applied_on) patch.applied_on = new Date().toISOString().slice(0, 10)
    setApplications((list) => list.map((a) => (a.id === id ? { ...a, ...patch } : a)))
    try {
      const updated = await updateApplication(id, patch)
      setApplications((list) => list.map((a) => (a.id === id ? updated : a)))
    } catch (err) {
      setError(err.message)
      load()
    }
  }

  const tabs = [{ key: 'all', label: 'All', count: total }, ...STATUSES.map((s) => ({ ...s, count: counts[s.key] }))]

  return (
    <>
      <header className="site-header">
        <div className="site-header-inner">
          <span className="wordmark">
            <span className="wordmark-small">Co-op</span>
            <span className="wordmark-large">Tracker</span>
          </span>
          <div className="header-actions">
            <button className="btn gold" onClick={() => setEditing({})}>+ Add application</button>
          </div>
        </div>
        <div className="stripes" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
      </header>

      <div className="app">
        <div className="page-title">
          <h1>Your co-op applications</h1>
          <p className="subtitle">{total} applications · {responseRate}% response rate</p>
        </div>

        <section className="stats">
          <div className="stat"><span className="stat-label">Submitted</span><span className="stat-value">{submitted}</span></div>
          <div className="stat"><span className="stat-label">Interviewing</span><span className="stat-value accent-interviewing">{counts.interviewing}</span></div>
          <div className="stat"><span className="stat-label">Offers</span><span className="stat-value accent-offer">{counts.offer}</span></div>
          <div className="stat"><span className="stat-label">Rejected</span><span className="stat-value accent-rejected">{counts.rejected}</span></div>
          <div className="stat"><span className="stat-label">Postings closed</span><span className="stat-value">{closedPostings}</span></div>
        </section>

        <SyncBar onSynced={load} />
        {error && <div className="banner">{error}</div>}

        <section className="panel">
          <div className="tabs" role="tablist">
            {tabs.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={statusFilter === t.key}
                className={`tab ${statusFilter === t.key ? 'active' : ''}`}
                onClick={() => setStatusFilter(t.key)}
              >
                {t.key !== 'all' && <span className={`dot status-${t.key}`} />}
                {t.label}
                <span className="tab-count">{t.count}</span>
              </button>
            ))}
          </div>

          <div className="toolbar">
            <input
              className="search"
              type="search"
              placeholder="Search company, role, city, job ID…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select className="filter" value={postingFilter} onChange={(e) => setPostingFilter(e.target.value)}>
              <option value="all">All postings</option>
              <option value="open">Open postings</option>
              <option value="closed">Closed postings</option>
            </select>
          </div>

          {loading ? (
            <p className="empty-state">Loading…</p>
          ) : (
            <>
              <ApplicationsTable
                rows={pageRows}
                sort={sort}
                onSort={toggleSort}
                onOpen={openApplication}
                onStatusChange={changeStatus}
              />
              <Pagination
                page={currentPage}
                pageSize={pageSize}
                total={visible.length}
                onPage={setPage}
                onPageSize={setPageSize}
              />
            </>
          )}
        </section>

        {editing && (
          <ApplicationForm initial={editing} onSave={save} onDelete={remove} onCancel={() => setEditing(null)} />
        )}

        {viewing && (
          <ApplicationDetails application={viewing} onSaveNotes={saveNotes} onClose={() => setViewing(null)} />
        )}

      </div>

      <footer className="site-footer">
        Co-op Tracker is a personal project and is not affiliated with or endorsed by the University of Waterloo.
      </footer>
    </>
  )
}
