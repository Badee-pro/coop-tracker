import { useEffect, useRef, useState } from 'react'
import { getSyncStatus, importWaterlooWorksItems } from '../api'

const WW_APPLICATIONS = 'https://waterlooworks.uwaterloo.ca/myAccount/co-op/full/applications.htm'

function timeAgo(iso) {
  if (!iso) return 'never'
  const minutes = Math.round((Date.now() - new Date(iso)) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  if (minutes < 1440) return `${Math.round(minutes / 60)} h ago`
  return new Date(iso).toLocaleDateString()
}

const isPhone = () => window.matchMedia('(max-width: 640px), (pointer: coarse) and (max-width: 900px)').matches
const extensionVersion = () => document.documentElement.dataset.coopSyncExtension

export default function SyncBar({ onSynced }) {
  const [status, setStatus] = useState(null)
  const [phone, setPhone] = useState(isPhone)
  const [extension, setExtension] = useState(extensionVersion)
  const [tabState, setTabState] = useState(null)
  const [needsExtension, setNeedsExtension] = useState(false)
  const onSyncedRef = useRef(onSynced)

  useEffect(() => {
    onSyncedRef.current = onSynced
  }, [onSynced])

  useEffect(() => {
    const refresh = () => getSyncStatus().then(setStatus).catch(() => setStatus(null))
    refresh()
    const interval = setInterval(refresh, 30000)
    const timer = setTimeout(() => setExtension(extensionVersion()), 300)
    const onResize = () => setPhone(isPhone())

    const onMessage = async (event) => {
      if (event.source !== window || event.origin !== window.location.origin) return
      if (event.data?.type === 'coop-applications') {
        setTabState('importing')
        try {
          setStatus(await importWaterlooWorksItems(event.data.items || []))
          setTabState(null)
          await onSyncedRef.current()
        } catch (err) {
          setTabState(`Import failed: ${err.message}`)
        }
      } else if (event.data?.type === 'coop-tab-closed') {
        setTabState((s) => (s === 'waiting' ? 'The WaterlooWorks tab was closed before it synced.' : s))
      }
    }

    window.addEventListener('resize', onResize)
    window.addEventListener('message', onMessage)
    return () => {
      clearInterval(interval)
      clearTimeout(timer)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('message', onMessage)
    }
  }, [])

  const syncInTab = () => {
    window.open(WW_APPLICATIONS, '_blank')
    setTabState('waiting')
  }

  const syncNow = () => (extension ? syncInTab() : setNeedsExtension(true))

  if (!status) return null

  if (phone) {
    return (
      <div className="sync-bar sync-ok">
        <span>
          <span className="sync-dot" />{' '}
          {status.last_success_at ? `Synced ${timeAgo(status.last_success_at)}` : 'Not synced yet'} · sync from your computer
        </span>
      </div>
    )
  }

  if (tabState === 'waiting' || tabState === 'importing') {
    return (
      <div className="sync-bar sync-pending">
        <span>
          <span className="sync-dot" />{' '}
          {tabState === 'importing'
            ? 'Saving your applications…'
            : 'WaterlooWorks opened in a new tab. Sign in there if asked; it syncs and closes by itself.'}
        </span>
        <span className="sync-actions">
          <button className="btn small" onClick={syncInTab}>Reopen tab</button>
          <button className="btn small ghost" onClick={() => setTabState(null)}>Cancel</button>
        </span>
      </div>
    )
  }

  const error = tabState
  const n = status.fetched

  return (
    <>
      <div className={`sync-bar ${error || needsExtension || !status.last_success_at ? 'sync-error' : 'sync-ok'}`}>
        <span>
          <span className="sync-dot" />{' '}
          {needsExtension ? (
            <>
              <strong>Syncing needs the Co-op Tracker Sync extension.</strong>{' '}
              <a href={`${import.meta.env.BASE_URL}coop-tracker-sync.zip`} download>Download it</a>
            </>
          ) : error ? (
            <>
              <strong>{error}</strong>
              {status.last_success_at && <span className="sync-last"> · Last synced {timeAgo(status.last_success_at)}</span>}
            </>
          ) : status.last_success_at ? (
            <>
              <strong>Synced from WaterlooWorks {timeAgo(status.last_success_at)}</strong>
              {n != null && ` · ${n} application${n === 1 ? '' : 's'}`}
              {status.result && ` (${status.result.created} new, ${status.result.updated} updated)`}
            </>
          ) : (
            <strong>Not synced with WaterlooWorks yet.</strong>
          )}
        </span>
        <button className="btn small primary" onClick={syncNow}>
          Sync from WaterlooWorks
        </button>
      </div>
    </>
  )
}
