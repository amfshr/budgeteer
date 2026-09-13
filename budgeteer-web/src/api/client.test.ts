import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiClientError, get, setUnauthorizedHandler } from './client'

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
  setUnauthorizedHandler(null)
})

describe('api client', () => {
  it('unwraps the data payload from a success envelope', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse(200, { success: true, data: { id: 'a1' }, timestamp: 'now' }),
        ),
    )

    await expect(get<{ id: string }>('/api/v1/accounts')).resolves.toEqual({ id: 'a1' })
  })

  it('throws ApiClientError carrying the envelope code on failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(400, {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'from must be before to' },
          timestamp: 'now',
        }),
      ),
    )

    const failure = get('/api/v1/transactions')
    await expect(failure).rejects.toBeInstanceOf(ApiClientError)
    await expect(failure).rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 })
  })

  it('invokes the unauthorized handler on a 401 envelope', async () => {
    const handler = vi.fn()
    setUnauthorizedHandler(handler)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(401, {
          success: false,
          error: { code: 'MISSING_TOKEN', message: 'Authentication required' },
          timestamp: 'now',
        }),
      ),
    )

    await expect(get('/api/v1/accounts')).rejects.toMatchObject({ code: 'MISSING_TOKEN' })
    expect(handler).toHaveBeenCalledOnce()
  })
})
