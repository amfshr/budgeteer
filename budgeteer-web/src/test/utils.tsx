import { vi } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from '../App'

/** Renders the real app (routes + providers) at a given URL. */
export function renderApp(route: string | { pathname: string; state?: unknown }) {
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

/**
 * URL-routed fetch mock for pages that fire several queries at once. Values are
 * envelope payloads (wrapped in ok() per call — Response bodies are single-use)
 * or factories returning a full Response. Longest matching prefix wins.
 */
export function mockApi(routes: Record<string, unknown | (() => Response)>) {
  const entries = Object.entries(routes).sort((a, b) => b[0].length - a[0].length)
  const fetchMock = vi.fn((...[input]: [RequestInfo | URL, RequestInit?]) => {
    const url = String(input)
    for (const [prefix, value] of entries) {
      if (url.startsWith(prefix)) {
        return Promise.resolve(
          typeof value === 'function' ? (value as () => Response)() : ok(value),
        )
      }
    }
    return Promise.resolve(err(404, 'RESOURCE_NOT_FOUND', `no mock for ${url}`))
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

export const testUser = {
  id: 'u-1',
  email: 'alex@example.com',
  emailVerified: true,
  createdAt: '2026-01-01T00:00:00Z',
}
