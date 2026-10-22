import { useState } from 'react'
import { STATUSES } from '../constants'
import { formatDate, isClosedPosting } from '../format'

const STATUS_LABEL = Object.fromEntries(STATUSES.map((s) => [s.key, s.label]))

function Field({ label, value }) {
  return (
    <div className="detail-field">
      <dt>{label}</dt>
      <dd>{value || '—'}</dd>
    </div>
  )
}

export default function ApplicationDetails({ application: a, onSaveNotes, onClose }) {
  const [notes, setNotes] = useState(a.notes || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)
  const dirty = notes !== (a.notes || '')

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      await onSaveNotes(a.id, notes)
      setSaved(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal details" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-label={`${a.company} details`}>
        <div className="details-head">
          <div>
            <h2>{a.company}</h2>
            <p className="details-role">{a.role}</p>
          </div>
          <span className={`status-tag pill-${a.status}`}>{STATUS_LABEL[a.status]}</span>
        </div>

        <dl className="details-grid">
          <Field label="WaterlooWorks status" value={a.source_status} />
          <Field
            label="Posting"
            value={a.job_status && (isClosedPosting(a.job_status) ? a.job_status : 'Open for applications')}
          />
          <Field label="Term" value={a.term} />
          <Field label="Job ID" value={a.external_id} />
          <Field label="Applied" value={a.applied_on && formatDate(a.applied_on)} />
          <Field label="Deadline" value={a.deadline_on && formatDate(a.deadline_on)} />
          <Field label="City" value={a.city} />
          <Field label="Location" value={a.location} />
          <Field label="Division" value={a.division} />
          <Field label="Openings" value={a.openings} />
        </dl>

        <p className="details-source">Synced from WaterlooWorks. These details update automatically on every sync.</p>

        <label className="notes-label" htmlFor="application-notes">Your notes</label>
        <textarea
          id="application-notes"
          className="notes-box"
          rows={5}
          placeholder="Interview prep, contacts, follow-ups…"
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value)
            setSaved(false)
          }}
        />
        {error && <p className="form-error">{error}</p>}

        <div className="modal-actions">
          {saved && !dirty && <span className="saved-hint">Notes saved</span>}
          <span className="spacer" />
          <button type="button" className="btn ghost" onClick={onClose}>Close</button>
          <button type="button" className="btn primary" onClick={save} disabled={!dirty || saving}>
            {saving ? 'Saving…' : 'Save notes'}
          </button>
        </div>
      </div>
    </div>
  )
}
