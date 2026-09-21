import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockApi, renderApp, testUser } from '../test/utils'

const account = {
  id: 'a1',
  provider: 'MONZO',
  accountType: 'CURRENT',
  institutionName: 'Monzo',
  displayName: 'Current Account',
  currency: 'GBP',
  balanceMinorUnits: 9177,
  balanceAsOf: '2026-09-15T10:00:00Z',
  archived: false,
  displayOrder: 0,
}

const transaction = {
  id: 't1',
  accountId: 'a1',
  amountMinorUnits: -450,
  currency: 'GBP',
  status: 'SETTLED',
  merchantName: 'Tesco',
  description: 'TESCO STORES',
  occurredAt: '2026-09-15T09:00:00Z',
}

const income = {
  id: 't2',
  accountId: 'a1',
  amountMinorUnits: 20000,
  currency: 'GBP',
  status: 'SETTLED',
  merchantName: null,
  description: 'Monthly top-up',
  occurredAt: '2026-09-15T08:00:00Z',
}

const page = (items: unknown[], totalPages = 1, totalElements = items.length) => ({
  items,
  page: 0,
  size: 25,
  totalElements,
  totalPages,
})

const summary = {
  accountId: 'a1',
  zone: 'Europe/London',
  today: { inMinorUnits: 0, outMinorUnits: 450 },
  thisWeek: { inMinorUnits: 0, outMinorUnits: 2000 },
  monthToDate: { inMinorUnits: 20000, outMinorUnits: 5000 },
}

const idleProgress = {
  accounts: [{ accountId: 'acc_1', status: 'COMPLETED', transactionCount: 1 }],
}

const activeConnection = {
  id: 'c1',
  monzoUserId: 'user_000',
  connectedAt: '2026-09-19T21:00:00Z',
  expiresAt: '2026-12-19T21:00:00Z',
  isActive: true,
  isTokenExpired: false,
}

const baseRoutes = {
  '/api/v1/auth/me': testUser,
  '/api/v1/monzo/connections': [activeConnection],
  '/api/v1/accounts/a1/summary': summary,
  '/api/v1/accounts': [account],
  '/api/v1/transactions': page([transaction, income]),
  '/api/v1/monzo/sync/progress': idleProgress,
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('overview (dashboard v1)', () => {
  it('renders balance, spend windows and recent transactions', async () => {
    mockApi(baseRoutes)
    renderApp('/app')

    expect(await screen.findByText('£91.77')).toBeInTheDocument()
    expect(screen.getByText(/as of/)).toBeInTheDocument()
    expect(await screen.findByText('£50.00')).toBeInTheDocument() // month out
    expect(screen.getByText('£20.00')).toBeInTheDocument() // week out
    expect(await screen.findByText('Tesco')).toBeInTheDocument()
    expect(screen.getByText('-£4.50')).toBeInTheDocument()
  })

  it('marks income with an explicit plus', async () => {
    mockApi(baseRoutes)
    renderApp('/app')

    expect(await screen.findByText('+£200.00')).toBeInTheDocument()
  })

  it('groups transactions under day headers', async () => {
    mockApi(baseRoutes)
    renderApp('/app')

    expect(await screen.findByText('15 September 2026')).toBeInTheDocument()
  })

  it('points at the connect page when no accounts exist', async () => {
    mockApi({ ...baseRoutes, '/api/v1/accounts': [], '/api/v1/transactions': page([]) })
    renderApp('/app')

    expect(await screen.findByRole('link', { name: 'Connect Monzo' })).toHaveAttribute(
      'href',
      '/app/connect',
    )
  })
})

describe('connect onboarding phases', () => {
  it('explains and offers the OAuth entry when nothing is connected', async () => {
    mockApi({
      ...baseRoutes,
      '/api/v1/accounts': [],
      '/api/v1/transactions': page([]),
      '/api/v1/monzo/sync/progress': { accounts: [] },
    })
    renderApp('/app/connect')

    expect(await screen.findByText('Connect your Monzo account')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Connect Monzo' })).toHaveAttribute(
      'href',
      '/api/v1/monzo/connect',
    )
  })

  it('prompts for the push approval right after the OAuth redirect', async () => {
    mockApi({
      ...baseRoutes,
      '/api/v1/accounts': [],
      '/api/v1/transactions': page([]),
      '/api/v1/monzo/sync/progress': { accounts: [] },
    })
    renderApp('/app/connect?monzo=connected')

    expect(await screen.findByText(/approve the notification/)).toBeInTheDocument()
  })

  it('shows live progress while importing', async () => {
    mockApi({
      ...baseRoutes,
      '/api/v1/accounts': [],
      '/api/v1/transactions': page([]),
      '/api/v1/monzo/sync/progress': {
        accounts: [{ accountId: 'acc_1', status: 'IN_PROGRESS', transactionCount: 1234 }],
      },
    })
    renderApp('/app/connect?monzo=connected')

    expect(await screen.findByText('Importing your transactions')).toBeInTheDocument()
    expect(screen.getByText(/1,234 imported so far/)).toBeInTheDocument()
  })

  it('celebrates completion and links to the overview', async () => {
    mockApi(baseRoutes)
    renderApp('/app/connect?monzo=connected')

    expect(await screen.findByText('Monzo sync complete')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to your overview' })).toHaveAttribute(
      'href',
      '/app',
    )
  })

  it('offers a reconnect path when data exists but the connection was unlinked', async () => {
    mockApi({ ...baseRoutes, '/api/v1/monzo/connections': [] })
    renderApp('/app/connect')

    expect(await screen.findByText(/syncing is paused/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Reconnect Monzo' })).toHaveAttribute(
      'href',
      '/api/v1/monzo/connect',
    )
  })

  it('shows a finishing state, not the approve prompt, during the ingest lag', async () => {
    mockApi({
      ...baseRoutes,
      '/api/v1/accounts': [],
      '/api/v1/transactions': page([]),
      '/api/v1/monzo/sync/progress': {
        accounts: [{ accountId: 'acc_1', status: 'COMPLETED', transactionCount: 4557 }],
      },
    })
    renderApp('/app/connect?monzo=connected')

    expect(await screen.findByText('Finishing up')).toBeInTheDocument()
    expect(screen.queryByText(/approve the notification/)).not.toBeInTheDocument()
  })

  it('shows a generic error phase for failed callbacks (replayed state etc.)', async () => {
    mockApi({
      ...baseRoutes,
      '/api/v1/accounts': [],
      '/api/v1/transactions': page([]),
      '/api/v1/monzo/sync/progress': { accounts: [] },
    })
    renderApp('/app/connect?monzo=error')

    expect(await screen.findByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Try again' })).toBeInTheDocument()
  })

  it('handles a denied consent with a retry path', async () => {
    mockApi({
      ...baseRoutes,
      '/api/v1/accounts': [],
      '/api/v1/transactions': page([]),
      '/api/v1/monzo/sync/progress': { accounts: [] },
    })
    renderApp('/app/connect?monzo=denied')

    expect(await screen.findByText('Connection cancelled')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Try again' })).toBeInTheDocument()
  })
})

describe('transactions page', () => {
  it('renders rows and pages forward', async () => {
    const fetchMock = mockApi({
      ...baseRoutes,
      '/api/v1/transactions': page([transaction], 2, 30),
    })
    renderApp('/app/transactions')

    expect(await screen.findByText('Tesco')).toBeInTheDocument()
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument()
    expect(screen.getByText('30 total')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Next' }))

    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('page=1'))).toBe(true)
  })
})

describe('settings — connected banks', () => {
  const connection = {
    id: 'c1',
    monzoUserId: 'user_000',
    connectedAt: '2026-09-19T21:00:00Z',
    expiresAt: '2026-12-19T21:00:00Z',
    isActive: true,
    isTokenExpired: false,
  }

  it('lists the connection with its status and connected date', async () => {
    mockApi({ ...baseRoutes, '/api/v1/monzo/connections': [connection] })
    renderApp('/app/settings')

    expect(await screen.findByText('Monzo')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText(/Connected 19 Sept? 2026/)).toBeInTheDocument()
  })

  it('flags an expired token as needing re-auth', async () => {
    mockApi({
      ...baseRoutes,
      '/api/v1/monzo/connections': [{ ...connection, isTokenExpired: true }],
    })
    renderApp('/app/settings')

    expect(await screen.findByText('Needs re-auth')).toBeInTheDocument()
  })

  it('sync now posts to the manual sync endpoint', async () => {
    const fetchMock = mockApi({
      ...baseRoutes,
      '/api/v1/monzo/connections': [connection],
      '/api/v1/monzo/sync': { accounts: [] },
    })
    renderApp('/app/settings')

    await userEvent.click(await screen.findByRole('button', { name: 'Sync now' }))

    expect(
      fetchMock.mock.calls.some(
        ([url, init]) => String(url) === '/api/v1/monzo/sync' && init?.method === 'POST',
      ),
    ).toBe(true)
  })

  it('unlinks after confirmation', async () => {
    const fetchMock = mockApi({ ...baseRoutes, '/api/v1/monzo/connections': [connection] })
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderApp('/app/settings')

    await userEvent.click(await screen.findByRole('button', { name: 'Unlink' }))

    expect(
      fetchMock.mock.calls.some(
        ([url, init]) =>
          String(url).includes('/api/v1/monzo/connections/c1') && init?.method === 'DELETE',
      ),
    ).toBe(true)
  })

  it('offers the connect link when nothing is linked', async () => {
    mockApi({ ...baseRoutes, '/api/v1/monzo/connections': [] })
    renderApp('/app/settings')

    expect(await screen.findByRole('link', { name: 'connect Monzo' })).toHaveAttribute(
      'href',
      '/app/connect',
    )
  })
})

describe('chrome', () => {
  it('shows the three destinations in navigation', async () => {
    mockApi(baseRoutes)
    renderApp('/app')

    const overviewLinks = await screen.findAllByRole('link', { name: /Overview/ })
    expect(overviewLinks.length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByRole('link', { name: /Transactions/ }).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByRole('link', { name: /Settings/ }).length).toBeGreaterThanOrEqual(1)
  })
})
