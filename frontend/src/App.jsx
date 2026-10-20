import { useEffect, useMemo, useState } from 'react'
import { STATUSES } from './constants'
import { listApplications, createApplication, updateApplication, deleteApplication } from './api'
import ApplicationCard from './components/ApplicationCard'
import ApplicationForm from './components/ApplicationForm'
import './App.css'

export default function App() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(null)
  const [query, setQuery] = useState('')
  const [dragOver, setDragOver] = useState(null)

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
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return applications
    return applications.filter((a) =>
      [a.company, a.role, a.location, a.notes].some((v) => v?.toLowerCase().includes(q)),
    )
  }, [applications, query])

  const byStatus = useMemo(
    () => Object.fromEntries(STATUSES.map((s) => [s.key, filtered.filter((a) => a.status === s.key)])),
    [filtered],
  )

  const total = applications.length
  const submitted = applications.filter((a) => a.status !== 'wishlist').length
  const responses = applications.filter((a) => ['interviewing', 'offer', 'rejected'].includes(a.status)).length
  const responseRate = submitted ? Math.round((responses / submitted) * 100) : 0

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

  const moveTo = async (id, status) => {
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

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Co-op Tracker</h1>
          <p className="subtitle">Keep every application moving.</p>
        </div>
        <button className="btn primary" onClick={() => setEditing({})}>+ Add application</button>
      </header>

      <section className="stats">
        <div className="stat"><span className="stat-value">{total}</span><span className="stat-label">Tracked</span></div>
        <div className="stat"><span className="stat-value">{submitted}</span><span className="stat-label">Submitted</span></div>
        <div className="stat"><span className="stat-value">{applications.filter((a) => a.status === 'interviewing').length}</span><span className="stat-label">Interviewing</span></div>
        <div className="stat"><span className="stat-value">{applications.filter((a) => a.status === 'offer').length}</span><span className="stat-label">Offers</span></div>
        <div className="stat"><span className="stat-value">{responseRate}%</span><span className="stat-label">Response rate</span></div>
      </section>

      {total > 0 && (
        <div className="progress" aria-label="Pipeline breakdown">
          {STATUSES.map((s) => {
            const count = applications.filter((a) => a.status === s.key).length
            return count ? (
              <div
                key={s.key}
                className={`progress-seg status-${s.key}`}
                style={{ flexGrow: count }}
                title={`${s.label}: ${count}`}
              />
            ) : null
          })}
        </div>
      )}

      <div className="toolbar">
        <input
          className="search"
          placeholder="Search company, role, location, notes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {error && <div className="banner">{error}</div>}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <main className="board">
          {STATUSES.map((s) => (
            <section
              key={s.key}
              className={`column ${dragOver === s.key ? 'drag-over' : ''}`}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(s.key)
              }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => {
                e.preventDefault()
                setDragOver(null)
                moveTo(Number(e.dataTransfer.getData('text/plain')), s.key)
              }}
            >
              <h3 className="column-title">
                <span className={`dot status-${s.key}`} />
                {s.label}
                <span className="count">{byStatus[s.key].length}</span>
              </h3>
              <div className="column-body">
                {byStatus[s.key].map((a) => (
                  <ApplicationCard key={a.id} application={a} onOpen={setEditing} />
                ))}
                {byStatus[s.key].length === 0 && <p className="empty">Drop here</p>}
              </div>
            </section>
          ))}
        </main>
      )}

      {editing && (
        <ApplicationForm
          initial={editing}
          onSave={save}
          onDelete={remove}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  )
}
