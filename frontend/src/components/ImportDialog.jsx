import { useState } from 'react'
import { importApplications } from '../api'
import { parseImportText } from '../parseWaterlooWorks'

export default function ImportDialog({ onDone, onCancel }) {
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [total, setTotal] = useState(0)

  const runImport = async (raw) => {
    setError(null)
    let rows
    try {
      rows = parseImportText(raw)
    } catch (err) {
      setError(err.message)
      return
    }
    setBusy(true)
    try {
      const res = await importApplications(rows)
      setResult({ ...res, rows: rows.length })
      setTotal((t) => t + res.created)
      setText('')
      await onDone()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text')
    if (!pasted.trim()) return
    e.preventDefault()
    setText(pasted)
    runImport(pasted)
  }

  const submit = async (e) => {
    e.preventDefault()
    await runImport(text)
  }

  return (
    <div className="modal-backdrop" onMouseDown={onCancel}>
      <form className="modal" onSubmit={submit} onMouseDown={(e) => e.stopPropagation()}>
        <h2>Import from WaterlooWorks</h2>
        <ol className="steps">
          <li>
            Open <strong>Co-op Jobs → Applications</strong> on WaterlooWorks.
          </li>
          <li>
            Click just before <strong>Job Title</strong> in the header and drag down to the last row of the table, then
            press <kbd>Ctrl</kbd>+<kbd>C</kbd>.
          </li>
          <li>
            Click in the box below and press <kbd>Ctrl</kbd>+<kbd>V</kbd>. It imports straight away.
          </li>
          <li>Repeat for each results page. Re-importing later updates existing applications.</li>
        </ol>

        {error && <p className="form-error">{error}</p>}
        {result && (
          <p className="form-success">
            Read {result.rows} rows: {result.created} added · {result.updated} updated · {result.unchanged} unchanged
            {result.errors.length > 0 && ` · ${result.errors.length} skipped`}
            {total > result.created && ` (${total} added this session)`}
          </p>
        )}

        <textarea
          className="import-box"
          rows={8}
          placeholder="Paste the copied WaterlooWorks table here"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPaste={handlePaste}
          autoFocus
        />

        <div className="modal-actions">
          <span className="spacer" />
          <button type="button" className="btn ghost" onClick={onCancel}>Close</button>
          <button type="submit" className="btn primary" disabled={busy || !text.trim()}>
            {busy ? 'Importing…' : 'Import'}
          </button>
        </div>
      </form>
    </div>
  )
}
