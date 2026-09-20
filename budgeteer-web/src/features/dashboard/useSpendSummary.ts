import { useQuery } from '@tanstack/react-query'
import { get } from '@/api/client'
import type { AccountResponse, AccountSummaryResponse } from '@/api/types'

/**
 * Combined spend windows across all accounts (dashboard dec 27 — the first
 * consumer of the summary API). One cache entry keyed by the account-id set;
 * sums the out-flows per window.
 */
export function useSpendSummary(accounts: AccountResponse[] | undefined) {
  const ids = (accounts ?? []).map((a) => a.id).filter((id): id is string => !!id)

  return useQuery({
    queryKey: ['spend-summary', ...ids],
    enabled: ids.length > 0,
    queryFn: async () => {
      const summaries = await Promise.all(
        ids.map((id) => get<AccountSummaryResponse>(`/api/v1/accounts/${id}/summary`)),
      )
      const sum = (pick: (s: AccountSummaryResponse) => number | undefined) =>
        summaries.reduce((total, s) => total + (pick(s) ?? 0), 0)
      return {
        weekOut: sum((s) => s.thisWeek?.outMinorUnits),
        weekIn: sum((s) => s.thisWeek?.inMinorUnits),
        monthOut: sum((s) => s.monthToDate?.outMinorUnits),
        monthIn: sum((s) => s.monthToDate?.inMinorUnits),
      }
    },
  })
}
