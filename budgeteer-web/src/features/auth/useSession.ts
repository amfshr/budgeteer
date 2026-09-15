import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiClientError } from '@/api/client'
import { fetchCurrentUser, logout as apiLogout, type User } from './api'

export const SESSION_KEY = ['session'] as const

/**
 * The session probe. A 401 resolves to null (signed out) rather than throwing —
 * "no session" is a state, not an error. Everything auth-dependent hangs off this
 * one cache entry: the global 401 handler writes null into it on mid-session
 * expiry, and RequireAuth reacts declaratively.
 */
export function useSession() {
  const query = useQuery<User | null>({
    queryKey: SESSION_KEY,
    queryFn: async () => {
      try {
        return await fetchCurrentUser()
      } catch (error) {
        if (error instanceof ApiClientError && error.status === 401) {
          return null
        }
        throw error
      }
    },
    staleTime: 5 * 60_000,
    retry: false,
  })

  return {
    user: query.data ?? null,
    isPending: query.isPending,
  }
}

/** Logout: revoke server-side, then wipe the ENTIRE query cache (privacy — no money data survives). */
export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: apiLogout,
    onSettled: () => {
      queryClient.clear()
    },
  })
}
