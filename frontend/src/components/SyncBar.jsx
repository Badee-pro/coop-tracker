import { useEffect, useState } from 'react'
import { getSyncStatus, syncWaterlooWorks } from '../api'

function timeAgo(iso) {
  if (!iso) return 'never'
  const minutes = Math.round((Date.now() - new Date(iso)) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  return new Date(iso).toLocaleString()
}

export default function SyncBar({ onSynced }) {
  const [status, setStatus] = useState(null)
  const [syncing, setSyncing] = useState(false)

  const refresh = async () => {
    try {
      setStatus(await getSyncStatus())
    } catch {
      setStatus(null)
    }
  }

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 15000)
    return () => clearInterval(interval)
  }, [])

  const syncNow = async () => {
    setSyncing(true)
    try {
      setStatus(await syncWaterlooWorks())
      await onSynced()
    } finally {
      setSyncing(false)
    }
  }

  if (!status) return null

  if (!status.configured) {
    return (
      <div className="setup">
        <strong>Connect WaterlooWorks (one-time)</strong>
        <ol>
          <li>Open <code>backend\.env</code> (copy it from <code>backend\.env.example</code> if it's missing).</li>
          <li>
            In Edge DevTools → Network, click the <code>applications.htm?page=1&amp;sort…</code> request. Paste its
            <strong> Cookie</strong> request header into <code>WW_COOKIE</code> and its URL into <code>WW_APPLICATIONS_URL</code>.
          </li>
          <li>Restart the app (<code>start.cmd</code>). It then syncs every {status.interval_minutes} minutes.</li>
        </ol>
      </div>
    )
  }

  return (
    <div className={`sync-bar ${status.ok === false ? 'sync-error' : ''}`}>
      <span>
        {status.ok === false ? (
          <>WaterlooWorks sync failed: {status.error}</>
        ) : (
          <>
            WaterlooWorks synced {timeAgo(status.synced_at)}
            {status.result && ` · ${status.fetched} applications (${status.result.created} new, ${status.result.updated} updated)`}
            {status.interval_minutes > 0 && ` · auto every ${status.interval_minutes} min`}
          </>
        )}
      </span>
      <button className="btn small" onClick={syncNow} disabled={syncing}>
        {syncing ? 'Syncing…' : 'Sync now'}
      </button>
    </div>
  )
}
