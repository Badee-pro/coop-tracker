const FIELDS = [
  [/^job title/, 'role'],
  [/^job id/, 'external_id'],
  [/^term/, 'term'],
  [/^organi[sz]ation/, 'company'],
  [/^app(lication)? status/, 'source_status'],
  [/^job status/, 'job_status'],
  [/^division/, 'division'],
  [/^location/, 'location'],
  [/^city/, 'city'],
  [/^openings/, 'openings'],
  [/^app(lication)? deadline/, 'deadline_on'],
  [/^app(lication)? submitted/, 'applied_on'],
]

const DATES = ['deadline_on', 'applied_on']
const clean = (s) => (s || '').replace(/\s+/g, ' ').trim()
const pad = (n) => String(n).padStart(2, '0')

function toDate(value) {
  const d = new Date(value.replace(/\s+\d{1,2}:\d{2}.*$/, ''))
  return isNaN(d) ? null : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function fieldFor(header) {
  const h = clean(header).toLowerCase()
  const hit = FIELDS.find(([re]) => re.test(h))
  return hit ? hit[1] : null
}

export function parseCopiedTable(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  const headerIndex = lines.findIndex((l) => /job id/i.test(l) && l.includes('\t'))
  if (headerIndex === -1) {
    throw new Error('Could not find the header row with "Job ID". Select the table starting from the column headers.')
  }

  const headers = lines[headerIndex].split('\t').map(fieldFor)
  const idIndex = headers.indexOf('external_id')
  const rows = []

  for (const line of lines.slice(headerIndex + 1)) {
    let cells = line.split('\t')
    const idPos = cells.findIndex((c) => /^\s*\d{5,7}\s*$/.test(c))
    if (idPos === -1) continue
    const shift = idPos - idIndex
    if (shift > 0) cells = cells.slice(shift)
    if (shift < 0) cells = Array(-shift).fill('').concat(cells)

    const row = {}
    headers.forEach((field, i) => {
      if (!field || cells[i] === undefined) return
      const value = clean(cells[i])
      row[field] = DATES.includes(field) ? toDate(value) : value
    })
    if (row.openings) row.openings = parseInt(row.openings, 10) || null
    if (row.external_id && row.role && row.company) rows.push(row)
  }

  if (rows.length === 0) throw new Error('Found the headers but no application rows.')
  return rows
}

export function parseImportText(text) {
  const trimmed = text.trim()
  if (trimmed.startsWith('[')) return JSON.parse(trimmed)
  return parseCopiedTable(text)
}
