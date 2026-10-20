function formatDate(value) {
  if (!value) return null
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function daysUntil(value) {
  if (!value) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((new Date(`${value}T00:00:00`) - today) / 86400000)
}

export default function ApplicationCard({ application, onOpen }) {
  const nextIn = daysUntil(application.next_step_on)
  const deadlineIn = daysUntil(application.deadline_on)

  return (
    <article
      className="card"
      draggable
      onDragStart={(e) => e.dataTransfer.setData('text/plain', String(application.id))}
      onClick={() => onOpen(application)}
    >
      <div className="card-company">{application.company}</div>
      <div className="card-role">{application.role}</div>
      {application.location && <div className="card-meta">{application.location}</div>}
      <div className="card-tags">
        {application.applied_on && <span className="tag">Applied {formatDate(application.applied_on)}</span>}
        {application.next_step_on && (
          <span className={`tag ${nextIn !== null && nextIn <= 3 && nextIn >= 0 ? 'tag-soon' : ''}`}>
            Next {formatDate(application.next_step_on)}
          </span>
        )}
        {application.deadline_on && (
          <span className={`tag ${deadlineIn !== null && deadlineIn <= 7 && deadlineIn >= 0 ? 'tag-soon' : ''}`}>
            Due {formatDate(application.deadline_on)}
          </span>
        )}
      </div>
    </article>
  )
}
