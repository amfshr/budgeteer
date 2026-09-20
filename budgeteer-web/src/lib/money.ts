/**
 * The one place money gets formatted (03 §2 rule: no arithmetic in components).
 * Amounts arrive as integer minor units + ISO currency; division by 100 assumes
 * 2-decimal currencies, which holds for everything Budgeteer handles (GBP).
 */
export function formatMoney(minorUnits: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
  }).format(minorUnits / 100)
}

/** Splits a formatted amount into major and minor parts ("£1,284", ".20") so the
 * pence can render de-emphasised (design pass, balance hero treatment). */
export function formatMoneyParts(
  minorUnits: number,
  currency: string,
): { major: string; minor: string } {
  const formatted = formatMoney(minorUnits, currency)
  const dot = formatted.lastIndexOf('.')
  if (dot === -1) return { major: formatted, minor: '' }
  return { major: formatted.slice(0, dot), minor: formatted.slice(dot) }
}
