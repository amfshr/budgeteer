import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from '../App'

/** Renders the real app (routes + providers) at a given URL. */
export function renderApp(route: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

/** Server envelope helpers matching ApiResponse/ApiError. */
export function ok(data: unknown): Response {
  return new Response(JSON.stringify({ success: true, data, timestamp: 't' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

export function err(status: number, code: string, message = 'Request failed'): Response {
  return new Response(
    JSON.stringify({ success: false, error: { code, message }, timestamp: 't' }),
    { status, headers: { 'Content-Type': 'application/json' } },
  )
}

export const testUser = {
  id: 'u-1',
  email: 'alex@example.com',
  emailVerified: true,
  createdAt: '2026-01-01T00:00:00Z',
}
