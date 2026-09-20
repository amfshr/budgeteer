import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { err, mockApi, renderApp, testUser } from './test/utils'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('public shell', () => {
  it('shows the login entry page at /', () => {
    renderApp('/')
    expect(screen.getByRole('heading', { name: /budgeteer/ })).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Email me a login link' })).toBeInTheDocument()
  })

  it('redirects unknown routes to the entry page', () => {
    renderApp('/nonsense')
    expect(screen.getByRole('heading', { name: /budgeteer/ })).toBeInTheDocument()
  })
})

describe('login flow', () => {
  it('submits the email and lands on the magic-link-sent page', async () => {
    mockApi({
      '/api/v1/auth/login': {
        message: 'sent',
        email: 'alex@example.com',
        accessToken: null,
        refreshToken: null,
      },
      '/api/v1/auth/me': () => err(401, 'MISSING_TOKEN'),
    })
    renderApp('/')

    await userEvent.type(screen.getByLabelText('Email'), 'alex@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Email me a login link' }))

    expect(await screen.findByText('Check your inbox')).toBeInTheDocument()
    expect(screen.getByText('alex@example.com')).toBeInTheDocument()
  })

  it('surfaces a server error on the form', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(err(500, 'INTERNAL_ERROR', 'boom')))
    renderApp('/')

    await userEvent.type(screen.getByLabelText('Email'), 'alex@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Email me a login link' }))

    expect(await screen.findByText("Couldn't send the link")).toBeInTheDocument()
  })
})

describe('magic-link sent page', () => {
  it('follows the session the moment another tab signs in', async () => {
    mockApi({
      '/api/v1/auth/me': testUser,
      '/api/v1/accounts': [],
      '/api/v1/transactions': { items: [], page: 0, size: 8, totalElements: 0, totalPages: 0 },
      '/api/v1/monzo/sync/progress': { accounts: [] },
      '/api/v1/monzo/connections': [],
    })
    renderApp({ pathname: '/auth/sent', state: { email: 'alex@example.com' } })

    // The waiting tab discovers the browser-wide session and lands in /app.
    expect(await screen.findByText('No accounts yet')).toBeInTheDocument()
  })
})

describe('verify flow', () => {
  it('verifies the token, establishes the session and lands in /app', async () => {
    mockApi({
      '/api/v1/auth/verify': { message: 'ok', email: null, accessToken: 'a', refreshToken: 'r' },
      '/api/v1/auth/me': testUser,
      '/api/v1/accounts': [],
      '/api/v1/transactions': { items: [], page: 0, size: 8, totalElements: 0, totalPages: 0 },
      '/api/v1/monzo/sync/progress': { accounts: [] },
    })
    renderApp('/auth/verify?token=valid-token')

    expect(await screen.findByText('No accounts yet')).toBeInTheDocument()
  })

  it('shows a clear error for an invalid or used token', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(err(401, 'INVALID_TOKEN')))
    renderApp('/auth/verify?token=bad-token')

    expect(await screen.findByText("This login link didn't work")).toBeInTheDocument()
  })

  it('treats a missing token as an invalid link', () => {
    renderApp('/auth/verify')
    expect(screen.getByText("This login link didn't work")).toBeInTheDocument()
  })
})

describe('RequireAuth', () => {
  it('redirects to the entry page when there is no session', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(err(401, 'MISSING_TOKEN')))
    renderApp('/app')

    expect(await screen.findByRole('button', { name: 'Email me a login link' })).toBeInTheDocument()
  })

  it('renders the authenticated shell with a session', async () => {
    mockApi({
      '/api/v1/auth/me': testUser,
      '/api/v1/accounts': [],
      '/api/v1/transactions': { items: [], page: 0, size: 8, totalElements: 0, totalPages: 0 },
      '/api/v1/monzo/sync/progress': { accounts: [] },
    })
    renderApp('/app')

    expect(await screen.findByText('No accounts yet')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /Settings/ }).length).toBeGreaterThanOrEqual(1)
  })
})

describe('logout', () => {
  it('revokes the session and returns to the entry page', async () => {
    const fetchMock = mockApi({
      '/api/v1/auth/me': testUser,
      '/api/v1/auth/logout': { message: 'bye', email: null, accessToken: null, refreshToken: null },
      '/api/v1/monzo/sync/progress': { accounts: [] },
    })
    renderApp('/app/settings')

    await userEvent.click(await screen.findByRole('button', { name: 'Log out' }))

    expect(await screen.findByRole('button', { name: 'Email me a login link' })).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/auth/logout',
      expect.objectContaining({ method: 'POST' }),
    )
  })
})
