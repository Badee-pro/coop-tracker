const DAY = 86400000

export function parseDay(value) {
  return value ? new Date(`${value}T00:00:00`) : null
}

export function formatDate(value) {
  const d = parseDay(value)
  if (!d) return '—'
  const sameYear = d.getFullYear() === new Date().getFullYear()
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) })
}

export function daysFromToday(value) {
  const d = parseDay(value)
  if (!d) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((d - today) / DAY)
}

export const isClosedPosting = (jobStatus) => Boolean(jobStatus) && !/^open/i.test(jobStatus)
