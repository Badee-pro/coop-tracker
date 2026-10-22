const APPLICATIONS_KEY = 'coopTracker.applications.v1'
const SYNC_KEY = 'coopTracker.sync.v1'

const STATUSES = ['wishlist', 'applied', 'interviewing', 'offer', 'rejected']

const SOURCE_STATUS_MAP = [
  [/not selected|not ranked|cancel|unsuccessful|declined|withdrawn/i, 'rejected'],
  [/offer|employed|matched|ranked/i, 'offer'],
  [/interview|selected/i, 'interviewing'],
  [/applied|submitted/i, 'applied'],
]

const KEY_MAP = {
  jobid: 'external_id',
  postingid: 'external_id',
  jobtitle: 'role',
  title: 'role',
  postingtitle: 'role',
  term: 'term',
  organization: 'company',
  organisation: 'company',
  orgname: 'company',
  company: 'company',
  appstatus: 'source_status',
  applicationstatus: 'source_status',
  status: 'source_status',
  jobstatus: 'job_status',
  postingstatus: 'job_status',
  division: 'division',
  divisionname: 'division',
  location: 'location',
  loc: 'location',
  region: 'location',
  city: 'city',
  openings: 'openings',
  numpos: 'openings',
  numberofopenings: 'openings',
  appdeadline: 'deadline_on',
  applicationdeadline: 'deadline_on',
  deadline: 'deadline_on',
  appsubmittedon: 'applied_on',
  applicationsubmittedon: 'applied_on',
  submittedon: 'applied_on',
  datesubmitted: 'applied_on',
  applieddate: 'applied_on',
}

const DATE_FIELDS = ['deadline_on', 'applied_on']
const SYNCED_FIELDS = ['external_id', 'role', 'company', 'term', 'location', 'city', 'division', 'openings', 'job_status', 'source_status', 'applied_on', 'deadline_on']
const EDITABLE_FIELDS = ['company', 'role', 'status', 'location', 'job_url', 'applied_on', 'deadline_on', 'next_step_on', 'notes', 'term', 'division', 'city', 'openings', 'job_status']

function read(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    throw new Error("Your browser blocked saving data (private browsing or storage is full). Your changes weren't saved.")
  }
}

const loadAll = () => read(APPLICATIONS_KEY, [])
const saveAll = (apps) => write(APPLICATIONS_KEY, apps)
const now = () => new Date().toISOString()
const pad = (n) => String(n).padStart(2, '0')
const blankToNull = (v) => (typeof v === 'string' ? v.trim() || null : v ?? null)

function statusFor(sourceStatus) {
  const hit = SOURCE_STATUS_MAP.find(([re]) => re.test(String(sourceStatus ?? '')))
  return hit ? hit[1] : 'applied'
}

function toDate(value) {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') {
    const d = new Date(value)
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  }
  const text = String(value)
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10)
  const d = new Date(text)
  return isNaN(d) ? null : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function normalize(field, value) {
  if (value === null || value === undefined) return null
  if (DATE_FIELDS.includes(field)) return toDate(value)
  if (field === 'openings') return Number.parseInt(value, 10) || null
  const text = typeof value === 'object' ? value.label ?? value.value ?? Object.values(value)[0] : value
  return String(text ?? '').trim().slice(0, 500) || null
}

export function mapItem(item) {
  const row = {}
  for (const cell of Array.isArray(item?.data) ? item.data : []) {
    if (!cell || typeof cell !== 'object') continue
    const field = KEY_MAP[String(cell.key ?? '').toLowerCase().replace(/[^a-z]/g, '')]
    if (field && (row[field] === undefined || row[field] === null || row[field] === '')) {
      row[field] = normalize(field, cell.value)
    }
  }
  if (row.external_id !== undefined && row.external_id !== null) row.external_id = String(row.external_id)
  return row
}

function validate(app) {
  const errors = []
  if (!blankToNull(app.company)) errors.push("Company can't be blank")
  if (!blankToNull(app.role)) errors.push("Role can't be blank")
  if (!STATUSES.includes(app.status)) errors.push('Status is not valid')
  if (errors.length) throw new Error(errors.join(', '))
}

function pickEditable(attrs) {
  const picked = {}
  for (const key of EDITABLE_FIELDS) {
    if (key in attrs) picked[key] = key === 'openings' ? Number.parseInt(attrs[key], 10) || null : blankToNull(attrs[key])
  }
  return picked
}

export async function listApplications() {
  return loadAll()
}

export async function createApplication(attrs) {
  const apps = loadAll()
  const app = {
    status: 'wishlist',
    ...Object.fromEntries(EDITABLE_FIELDS.map((k) => [k, null])),
    ...pickEditable(attrs),
    id: apps.reduce((max, a) => Math.max(max, a.id), 0) + 1,
    external_id: null,
    source_status: null,
    created_at: now(),
    updated_at: now(),
  }
  if (!app.status) app.status = 'wishlist'
  validate(app)
  saveAll([app, ...apps])
  return app
}

export async function updateApplication(id, attrs) {
  const apps = loadAll()
  const index = apps.findIndex((a) => a.id === id)
  if (index === -1) throw new Error('Not found')
  const current = apps[index]
  const changes = current.external_id ? { notes: blankToNull(attrs.notes) } : pickEditable(attrs)
  if (current.external_id && !('notes' in attrs)) return current
  const updated = { ...current, ...changes, updated_at: now() }
  validate(updated)
  apps[index] = updated
  saveAll(apps)
  return updated
}

export async function deleteApplication(id) {
  saveAll(loadAll().filter((a) => a.id !== id))
  return null
}

export async function getSyncStatus() {
  return read(SYNC_KEY, {})
}

export async function importWaterlooWorksItems(items) {
  const rows = (Array.isArray(items) ? items : []).slice(0, 2000).map(mapItem).filter((r) => r.external_id)
  const apps = loadAll()
  const byExternalId = new Map(apps.filter((a) => a.external_id).map((a) => [a.external_id, a]))
  let nextId = apps.reduce((max, a) => Math.max(max, a.id), 0) + 1
  const result = { created: 0, updated: 0, unchanged: 0, errors: [] }

  for (const row of rows) {
    const existing = byExternalId.get(row.external_id)
    if (!row.company || !row.role) {
      result.errors.push(`${row.external_id}: missing company or role`)
      continue
    }
    if (!existing) {
      const app = {
        ...Object.fromEntries(EDITABLE_FIELDS.map((k) => [k, null])),
        ...Object.fromEntries(SYNCED_FIELDS.map((k) => [k, row[k] ?? null])),
        status: statusFor(row.source_status),
        id: nextId++,
        created_at: now(),
        updated_at: now(),
      }
      apps.push(app)
      byExternalId.set(app.external_id, app)
      result.created += 1
      continue
    }

    const statusChanged = existing.source_status !== (row.source_status ?? null)
    const changed = SYNCED_FIELDS.some((k) => (existing[k] ?? null) !== (row[k] ?? null))
    if (!changed) {
      result.unchanged += 1
      continue
    }
    for (const k of SYNCED_FIELDS) existing[k] = row[k] ?? null
    if (statusChanged) existing.status = statusFor(row.source_status)
    existing.updated_at = now()
    result.updated += 1
  }

  saveAll(apps)
  const status = { last_success_at: now(), fetched: rows.length, result }
  write(SYNC_KEY, status)
  return status
}
