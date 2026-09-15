import { useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { verifyMagicLink } from './api'
import { SESSION_KEY } from './useSession'

/**
 * Landing target of the emailed magic link (/auth/verify?token=...).
 * Verification is a one-shot mutation — the token is single-use server-side,
 * so the fired ref guards against StrictMode's double-effect in dev.
 */
export default function VerifyPage() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const fired = useRef(false)

  const verify = useMutation({
    mutationFn: verifyMagicLink,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: SESSION_KEY })
      navigate('/app', { replace: true })
    },
  })

  const { mutate } = verify
  useEffect(() => {
    if (!token || fired.current) return
    fired.current = true
    mutate(token)
  }, [token, mutate])

  if (!token || verify.isError) {
    return (
      <div className="w-full max-w-sm space-y-4">
        <Alert variant="destructive">
          <AlertTitle>This login link didn&apos;t work</AlertTitle>
          <AlertDescription>
            It may have expired (links last 30 minutes) or already been used. Request a fresh one
            and try again.
          </AlertDescription>
        </Alert>
        <Button asChild className="w-full">
          <Link to="/">Back to sign in</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <div
        role="status"
        aria-label="Signing you in"
        className="border-muted-foreground size-5 animate-spin rounded-full border-2 border-t-transparent"
      />
      <p className="text-muted-foreground">Signing you in…</p>
    </div>
  )
}
