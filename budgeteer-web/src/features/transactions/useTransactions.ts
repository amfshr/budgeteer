import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { get } from '@/api/client'
import type { TransactionPage } from '@/api/types'

export const TRANSACTIONS_KEY = ['transactions'] as const

export function fetchTransactions(page: number, size = 25): Promise<TransactionPage> {
  return get<TransactionPage>(`/api/v1/transactions?page=${page}&size=${size}`)
}

export function useTransactions(page: number, size = 25) {
  return useQuery({
    queryKey: [...TRANSACTIONS_KEY, page, size],
    queryFn: () => fetchTransactions(page, size),
    // keep the previous page rendered while the next loads — no pagination flicker
    placeholderData: keepPreviousData,
  })
}
