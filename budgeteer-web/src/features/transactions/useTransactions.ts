import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { get } from '@/api/client'
import type { TransactionPage } from '@/api/types'

export const TRANSACTIONS_KEY = ['transactions'] as const

export function fetchTransactions(
  page: number,
  size = 25,
  accountId?: string,
): Promise<TransactionPage> {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (accountId) params.set('accountId', accountId)
  return get<TransactionPage>(`/api/v1/transactions?${params}`)
}

export function useTransactions(page: number, size = 25, accountId?: string) {
  return useQuery({
    queryKey: [...TRANSACTIONS_KEY, page, size, accountId ?? 'all'],
    queryFn: () => fetchTransactions(page, size, accountId),
    // keep the previous page rendered while the next loads — no pagination flicker
    placeholderData: keepPreviousData,
  })
}
