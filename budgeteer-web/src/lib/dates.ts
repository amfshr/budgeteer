/** Human day label for transaction group headers: Today / Yesterday / 15 September 2026. */
export function dayLabel(iso: string, now: Date = new Date()): string {
  const date = new Date(iso)
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

/** Groups items by dayLabel of the given ISO field, preserving input order. */
export function groupByDay<T>(items: T[], getIso: (item: T) => string | undefined) {
  const groups: { label: string; items: T[] }[] = []
  for (const item of items) {
    const iso = getIso(item)
    const label = iso ? dayLabel(iso) : 'Unknown date'
    const last = groups[groups.length - 1]
    if (last && last.label === label) {
      last.items.push(item)
    } else {
      groups.push({ label, items: [item] })
    }
  }
  return groups
}

/** "as of" stamp in the design's voice: time for today, day + time otherwise. */
export function asOfLabel(iso: string, now: Date = new Date()): string {
  const date = new Date(iso)
  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const label = dayLabel(iso, now)
  if (label === 'Today') return `as of ${time} today`
  if (label === 'Yesterday') return `as of ${time} yesterday`
  return `as of ${label}`
}

/** "1–20 Sep" style month-to-date range label for the spend cards. */
export function monthRangeLabel(now: Date = new Date()): string {
  return `1\u2013${now.getDate()} ${now.toLocaleDateString('en-GB', { month: 'short' })}`
}
