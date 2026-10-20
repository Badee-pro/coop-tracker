import { useState } from 'react'
import { STATUSES, EMPTY_APPLICATION } from '../constants'

export default function ApplicationForm({ initial, onSave, onDelete, onCancel }) {
  const [form, setForm] = useState(() => {
    const base = { ...EMPTY_APPLICATION, ...initial }
    return Object.fromEntries(Object.entries(base).map(([k, v]) => [k, v ?? '']))
  })
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const isEdit = Boolean(initial?.id)

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const { id, created_at, updated_at, ...payload } = form
      await onSave(payload)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onCancel}>
      <form className="modal" onSubmit={submit} onMouseDown={(e) => e.stopPropagation()}>
        <h2>{isEdit ? 'Edit application' : 'New application'}</h2>
        {error && <p className="form-error">{error}</p>}

        <div className="grid">
          <label>
            Company *
            <input value={form.company} onChange={set('company')} required autoFocus />
          </label>
          <label>
            Role *
            <input value={form.role} onChange={set('role')} required />
          </label>
          <label>
            Status
            <select value={form.status} onChange={set('status')}>
              {STATUSES.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </label>
          <label>
            Location
            <input value={form.location} onChange={set('location')} />
          </label>
          <label className="span-2">
            Posting URL
            <input type="url" value={form.job_url} onChange={set('job_url')} placeholder="https://" />
          </label>
          <label>
            Applied on
            <input type="date" value={form.applied_on} onChange={set('applied_on')} />
          </label>
          <label>
            Deadline
            <input type="date" value={form.deadline_on} onChange={set('deadline_on')} />
          </label>
          <label>
            Next step on
            <input type="date" value={form.next_step_on} onChange={set('next_step_on')} />
          </label>
          <label className="span-2">
            Notes
            <textarea rows={4} value={form.notes} onChange={set('notes')} />
          </label>
        </div>

        <div className="modal-actions">
          {isEdit && (
            <button type="button" className="btn danger" onClick={onDelete}>Delete</button>
          )}
          <span className="spacer" />
          <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}
