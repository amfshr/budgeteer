import { useQuery } from '@tanstack/react-query'
import { get } from '@/api/client'
import type { AccountResponse } from '@/api/types'

export const ACCOUNTS_KEY = ['accounts'] as const

export function fetchAccounts(): Promise<AccountResponse[]> {
  return get<AccountResponse[]>('/api/v1/accounts')
}

export function useAccounts() {
  return useQuery({ queryKey: ACCOUNTS_KEY, queryFn: fetchAccounts })
}
