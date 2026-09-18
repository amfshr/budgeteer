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

const page = (items: unknown[], totalPages = 1, totalElements = items.length) => ({
  items,
  page: 0,
  size: 25,
  totalElements,
  totalPages,
})

const idleProgress = {
  accounts: [{ accountId: 'acc_1', status: 'COMPLETED', transactionCount: 1 }],
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('overview', () => {
  it('renders accounts with balance, as-of stamp and recent transactions', async () => {
    mockApi({
      '/api/v1/auth/me': testUser,
      '/api/v1/accounts': [account],
      '/api/v1/transactions': page([transaction]),
      '/api/v1/monzo/sync/progress': idleProgress,
    })
    renderApp('/app')

    expect(await screen.findByText('Current Account')).toBeInTheDocument()
    expect(screen.getByText('£91.77')).toBeInTheDocument()
    expect(screen.getByText(/as of/)).toBeInTheDocument()
    expect(await screen.findByText('Tesco')).toBeInTheDocument()
    expect(screen.getByText('-£4.50')).toBeInTheDocument()
  })

  it('shows the connect card when no accounts exist', async () => {
    mockApi({
      '/api/v1/auth/me': testUser,
      '/api/v1/accounts': [],
      '/api/v1/transactions': page([]),
      '/api/v1/monzo/sync/progress': { accounts: [] },
    })
    renderApp('/app')

    expect(await screen.findByRole('link', { name: 'Connect Monzo' })).toHaveAttribute(
      'href',
      '/api/v1/monzo/connect',
    )
  })

  it('shows the denied banner after a cancelled connect', async () => {
    mockApi({
      '/api/v1/auth/me': testUser,
      '/api/v1/accounts': [],
      '/api/v1/transactions': page([]),
      '/api/v1/monzo/sync/progress': { accounts: [] },
    })
    renderApp('/app?monzo=denied')

    expect(await screen.findByText('Connection cancelled')).toBeInTheDocument()
  })

  it('shows import progress while a backfill runs', async () => {
    mockApi({
      '/api/v1/auth/me': testUser,
      '/api/v1/accounts': [account],
      '/api/v1/transactions': page([transaction]),
      '/api/v1/monzo/sync/progress': {
        accounts: [{ accountId: 'acc_1', status: 'IN_PROGRESS', transactionCount: 1234 }],
      },
    })
    renderApp('/app')

    expect(await screen.findByText(/Importing transactions/)).toBeInTheDocument()
    expect(screen.getByText(/1,234 so far/)).toBeInTheDocument()
  })
})

describe('transactions page', () => {
  it('renders rows and pages forward', async () => {
    const fetchMock = mockApi({
      '/api/v1/auth/me': testUser,
      '/api/v1/transactions': page([transaction], 2, 30),
      '/api/v1/monzo/sync/progress': idleProgress,
      '/api/v1/accounts': [account],
    })
    renderApp('/app/transactions')

    expect(await screen.findByText('Tesco')).toBeInTheDocument()
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument()
    expect(screen.getByText('30 total')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Next' }))

    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('page=1'))).toBe(true)
  })
})
