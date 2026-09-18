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
