import { useEffect } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ApiClientError } from '@/api/client'
import { fetchCurrentUser } from './api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requestMagicLink } from './api'

export default function MagicLinkSentPage() {
  const location = useLocation()
  const email = (location.state as { email?: string } | null)?.email

  const resend = useMutation({ mutationFn: requestMagicLink })
  const navigate = useNavigate()

  // The emailed link usually opens a NEW tab; cookies are browser-wide, so this
  // waiting tab polls the session and follows the moment the other tab signs in.
  const session = useQuery({
    queryKey: ['session-watch'],
    queryFn: async () => {
      try {
        return await fetchCurrentUser()
      } catch (error) {
        if (error instanceof ApiClientError && error.status === 401) return null
        throw error
      }
    },
    refetchInterval: 3000,
  })

  useEffect(() => {
    if (session.data) navigate('/app', { replace: true })
  }, [session.data, navigate])

  // Deep-linking here without having submitted an email makes no sense — start over.
  if (!email) {
    return <Navigate to="/" replace />
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Check your inbox</CardTitle>
        <CardDescription>
          We sent a login link to <span className="text-foreground font-medium">{email}</span>. It
          expires in 30 minutes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          variant="outline"
          className="w-full"
          disabled={resend.isPending}
          onClick={() => resend.mutate(email)}
        >
          {resend.isPending ? 'Sending…' : resend.isSuccess ? 'Sent again ✓' : 'Resend the link'}
        </Button>
        <p className="text-muted-foreground text-center text-sm">
          Wrong address?{' '}
          <Link to="/" className="underline underline-offset-4">
            Start over
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
