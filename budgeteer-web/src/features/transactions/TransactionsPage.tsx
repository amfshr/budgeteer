import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAccounts } from '@/features/accounts/useAccounts'
import { accountLabel } from '@/features/accounts/accountLabel'
import TransactionList from './TransactionList'
import { useTransactions } from './useTransactions'

export default function TransactionsPage() {
  const [page, setPage] = useState(0)
  const [accountId, setAccountId] = useState<string | undefined>(undefined)
  const accounts = useAccounts()
  const { data, isPending, isError } = useTransactions(page, 25, accountId)

  const totalPages = data?.totalPages ?? 0
  const hasPrev = page > 0
  const hasNext = page + 1 < totalPages
  const showFilter = (accounts.data?.length ?? 0) > 1

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold tracking-tight">Transactions</h2>
        <div className="flex items-center gap-3">
          {showFilter && (
            <Select
              value={accountId ?? 'all'}
              onValueChange={(value) => {
                setAccountId(value === 'all' ? undefined : value)
                setPage(0)
              }}
            >
              <SelectTrigger className="w-44" aria-label="Filter by account">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All accounts</SelectItem>
                {(accounts.data ?? []).map((account) => (
                  <SelectItem key={account.id} value={account.id ?? ''}>
                    {accountLabel(account)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {data?.totalElements != null && (
            <p className="text-muted-foreground text-sm">{data.totalElements} total</p>
          )}
        </div>
      </div>

      {isPending && <p className="text-muted-foreground text-sm">Loading…</p>}
      {isError && <p className="text-destructive text-sm">Couldn&apos;t load transactions.</p>}
      {data && <TransactionList transactions={data.items ?? []} />}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={!hasPrev}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <p className="text-muted-foreground text-sm">
            Page {page + 1} of {totalPages}
          </p>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasNext}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </section>
  )
}
