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
