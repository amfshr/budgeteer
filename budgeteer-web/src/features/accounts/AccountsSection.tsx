import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Money from '@/components/Money'
import type { AccountResponse } from '@/api/types'

/** Plain v0 rendering — Session 02 owns how this SHOULD look. */
export default function AccountsSection({ accounts }: { accounts: AccountResponse[] }) {
  return (
    <section className="space-y-3">
      <h3 className="text-lg font-semibold tracking-tight">Accounts</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {accounts.map((account) => (
          <Card key={account.id}>
            <CardHeader>
              <CardTitle>{account.displayName ?? account.institutionName}</CardTitle>
              <CardDescription>
                {account.institutionName} · {account.accountType?.toLowerCase()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {account.balanceMinorUnits != null && account.currency ? (
                <>
                  <Money
                    minorUnits={account.balanceMinorUnits}
                    currency={account.currency}
                    className="text-2xl font-semibold"
                  />
                  {account.balanceAsOf && (
                    // balance snapshots are honest about staleness — always show as-of
                    <p className="text-muted-foreground mt-1 text-xs">
                      as of {new Date(account.balanceAsOf).toLocaleString()}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground text-sm">Balance not yet synced</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
