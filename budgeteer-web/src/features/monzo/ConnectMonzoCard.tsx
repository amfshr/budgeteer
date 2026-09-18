import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Shown when no accounts exist. The connect "button" is a plain navigation:
 * GET /api/v1/monzo/connect is a server-side redirect straight to Monzo's consent
 * page (cookie auth + the dev proxy make it work from the app's own origin).
 */
export default function ConnectMonzoCard() {
  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Connect your Monzo account</CardTitle>
        <CardDescription>
          You&apos;ll be sent to Monzo to approve access — approve the push notification in your
          Monzo app promptly, then your balances and transaction history import automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild className="w-full">
          <a href="/api/v1/monzo/connect">Connect Monzo</a>
        </Button>
      </CardContent>
    </Card>
  )
}
