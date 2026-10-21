import { STATUSES } from '../constants'
import { formatDate, daysFromToday, isClosedPosting } from '../format'

const COLUMNS = [
  { key: 'company', label: 'Company / Role' },
  { key: 'status', label: 'Status' },
  { key: 'job_status', label: 'Posting' },
  { key: 'city', label: 'Location' },
  { key: 'applied_on', label: 'Applied' },
  { key: 'deadline_on', label: 'Deadline' },
  { key: 'external_id', label: 'Job ID' },
]

function SortIcon({ active, dir }) {
  if (!active) return <span className="sort-icon">↕</span>
  return <span className="sort-icon active">{dir === 'asc' ? '↑' : '↓'}</span>
}

function Deadline({ value, closed }) {
  const days = daysFromToday(value)
  if (days === null) return <span className="muted">—</span>
  const soon = !closed && days >= 0 && days <= 3
  return (
    <span className={soon ? 'deadline-soon' : days < 0 ? 'muted' : undefined}>
      {formatDate(value)}
      {soon && <small>{days === 0 ? ' today' : ` in ${days}d`}</small>}
    </span>
  )
}

export default function ApplicationsTable({ rows, sort, onSort, onOpen, onStatusChange }) {
  if (rows.length === 0) {
    return <div className="empty-state">No applications match these filters.</div>
  }

  return (
    <div className="table-wrap">
      <table className="apps-table">
        <thead>
          <tr>
            {COLUMNS.map((c) => (
              <th key={c.key} onClick={() => onSort(c.key)} className={`col-${c.key}`}>
                {c.label}
                <SortIcon active={sort.key === c.key} dir={sort.dir} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => {
            const closed = isClosedPosting(a.job_status)
            return (
              <tr key={a.id} onClick={() => onOpen(a)}>
                <td className="col-company">
                  <div className="company">{a.company}</div>
                  <div className="role">{a.role}</div>
                </td>
                <td className="col-status" onClick={(e) => e.stopPropagation()}>
                  <select
                    className={`status-pill pill-${a.status}`}
                    value={a.status}
                    onChange={(e) => onStatusChange(a.id, e.target.value)}
                    aria-label={`Status for ${a.company}`}
                  >
                    {STATUSES.map((s) => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                  {a.source_status && a.source_status !== 'Applied' && (
                    <div className="source-status">WW: {a.source_status}</div>
                  )}
                </td>
                <td className="col-job_status">
                  {a.job_status ? (
                    <span className={`posting ${closed ? 'posting-closed' : 'posting-open'}`}>
                      {closed ? a.job_status : 'Open'}
                    </span>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td className="col-city">
                  <div>{a.city || a.location || '—'}</div>
                  {a.city && a.location && <div className="sub">{a.location}</div>}
                </td>
                <td className="col-applied_on">{formatDate(a.applied_on)}</td>
                <td className="col-deadline_on">
                  <Deadline value={a.deadline_on} closed={closed} />
                </td>
                <td className="col-external_id mono">{a.external_id || '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
