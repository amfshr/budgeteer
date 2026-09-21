import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useMutation } from '@tanstack/react-query'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ApiClientError } from '@/api/client'
import { requestMagicLink } from './api'
import Wordmark from '@/components/Wordmark'

/** The entry page: landing folded into login (Session 01 dec 6). */
export default function LoginPage() {
  const [email, setEmail] = useState('')
  const navigate = useNavigate()

  const sendLink = useMutation({
    mutationFn: requestMagicLink,
    onSuccess: (_data, submittedEmail) => {
      navigate('/auth/sent', { state: { email: submittedEmail } })
    },
  })

  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          <Wordmark />
        </h1>
        <p className="text-muted-foreground mt-3">Your money, one place.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            We&apos;ll email you a login link — no password needed. New here? The same link creates
            your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              sendLink.mutate(email)
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            {sendLink.isError && (
              <Alert variant="destructive">
                <AlertTitle>Couldn&apos;t send the link</AlertTitle>
                <AlertDescription>
                  {sendLink.error instanceof ApiClientError &&
                  sendLink.error.code !== 'INVALID_RESPONSE'
                    ? sendLink.error.message
                    : 'Something went wrong — please try again.'}
                </AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={sendLink.isPending}>
              {sendLink.isPending ? 'Sending…' : 'Email me a login link'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
