import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { del, get, post } from '@/api/client'
import type { MonzoConnectionResponse, MonzoSyncProgressResponse } from '@/api/types'

export const CONNECTIONS_KEY = ['monzo-connections'] as const

export function fetchConnections(): Promise<MonzoConnectionResponse[]> {
  return get<MonzoConnectionResponse[]>('/api/v1/monzo/connections')
}

export function useConnections() {
  return useQuery({ queryKey: CONNECTIONS_KEY, queryFn: fetchConnections })
}

/**
 * Manual sync-now: the hourly delta+ingest run, on demand. Invalidates the whole
 * cache on success — a user-requested refresh should refresh everything visible.
 */
export function useSyncNow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => post<MonzoSyncProgressResponse>('/api/v1/monzo/sync'),
    onSuccess: () => queryClient.invalidateQueries(),
  })
}

/** Unlink a bank connection — soft delete: syncing stops, data stays (#15 adds Monzo-side revoke). */
export function useDisconnect() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => del<void>(`/api/v1/monzo/connections/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CONNECTIONS_KEY }),
  })
}
