import type { AccountResponse } from '@/api/types'

/**
 * Display name with a sane fallback (dec 30): Monzo's `description` for retail
 * accounts is their internal user id — when displayName looks like an id (or is
 * missing), fall back to "Monzo Current Account" style. Server-side mapping does
 * the same; this guards rows ingested before that fix.
 */
export function accountLabel(account: AccountResponse): string {
  const name = account.displayName
  const looksLikeId = !name || /^(user|acc)_[0-9a-zA-Z]+$/.test(name)
  if (!looksLikeId) return name
  const type = (account.accountType ?? 'account')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^./, (c) => c.toUpperCase())
  return `${account.institutionName ?? 'Bank'} ${type}`
}
