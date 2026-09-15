import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { setUnauthorizedHandler } from '@/api/client'
import { SESSION_KEY } from './useSession'

/**
 * Wires the api client's global 401 handler to the session cache: any request
 * meeting an expired session writes null into ['session'], and every mounted
 * RequireAuth redirects declaratively. No imperative navigation, no router
 * dependency here.
 */
export default function AuthBridge() {
  const queryClient = useQueryClient()

  useEffect(() => {
    setUnauthorizedHandler(() => {
      queryClient.setQueryData(SESSION_KEY, null)
    })
    return () => setUnauthorizedHandler(null)
  }, [queryClient])

  return null
}
