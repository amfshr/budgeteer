import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { get } from '@/api/client'
import type { MonzoSyncProgressResponse } from '@/api/types'
import { ACCOUNTS_KEY } from '@/features/accounts/useAccounts'
import { TRANSACTIONS_KEY } from '@/features/transactions/useTransactions'

export function fetchSyncProgress(): Promise<MonzoSyncProgressResponse> {
  return get<MonzoSyncProgressResponse>('/api/v1/monzo/sync/progress')
}

function anyInProgress(data: MonzoSyncProgressResponse | undefined): boolean {
  return (data?.accounts ?? []).some((a) => a.status === 'IN_PROGRESS')
}

/**
 * The first-connect contract (debug finding #6): poll while the backfill runs so
 * data streams into the UI without a manual refresh — accounts/transactions caches
 * are invalidated on every progress change and once more when the sync completes.
 */
export function useSyncProgress() {
  const queryClient = useQueryClient()
  // Post-completion catch-up: sync/progress tracks the BACKFILL, but the ingest
  // (raw → domain) lags it by ~25s for a full history — keep refreshing for a few
  // slow polls after completion or the final data lands with nobody listening.
  const tailPolls = useRef(0)

  const query = useQuery({
    queryKey: ['sync-progress'],
    queryFn: fetchSyncProgress,
    // Fast poll while a backfill runs; slow background poll otherwise — a fresh
    // connect starts syncing AFTER the first fetch (SCA retries), so the poll must
    // keep looking or the progress banner never appears on first connect.
    refetchInterval: (q) => (anyInProgress(q.state.data) ? 2000 : 15000),
  })

  const syncing = anyInProgress(query.data)

  useEffect(() => {
    if (syncing) {
      tailPolls.current = 4
      void queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY })
      void queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY })
    } else if (tailPolls.current > 0) {
      tailPolls.current -= 1
      void queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY })
      void queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY })
    }
  }, [syncing, query.dataUpdatedAt, queryClient])

  const transactionCount = (query.data?.accounts ?? []).reduce(
    (sum, a) => sum + (a.transactionCount ?? 0),
    0,
  )

  return { syncing, transactionCount, accounts: query.data?.accounts ?? [] }
}
