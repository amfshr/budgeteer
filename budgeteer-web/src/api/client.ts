/**
 * Thin fetch wrapper speaking the backend's response envelope.
 *
 * Every Budgeteer endpoint returns one of:
 *   success: { success: true,  data: T,                                timestamp: string }
 *   failure: { success: false, error: { code, message, ... },          timestamp: string }
 * including 401s, which the server emits as a JSON envelope with code MISSING_TOKEN
 * (ApiAuthenticationEntryPoint) rather than a bare status.
 */

export interface ApiErrorDetails {
  code: string
  message: string
  [key: string]: unknown
}

interface ApiSuccess<T> {
  success: true
  data: T
  timestamp: string
}

interface ApiFailure {
  success: false
  error: ApiErrorDetails
  timestamp: string
}

export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure

export class ApiClientError extends Error {
  readonly code: string
  readonly status: number

  constructor(code: string, message: string, status: number) {
    super(message)
    this.name = 'ApiClientError'
    this.code = code
    this.status = status
  }
}

type UnauthorizedHandler = () => void

let onUnauthorized: UnauthorizedHandler | null = null

/** Registered once at app start — e.g. redirect to the login route. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorized = handler
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: 'same-origin',
    headers: { Accept: 'application/json', ...init?.headers },
    ...init,
  })

  let envelope: ApiEnvelope<T>
  try {
    envelope = (await response.json()) as ApiEnvelope<T>
  } catch {
    throw new ApiClientError(
      'INVALID_RESPONSE',
      `Non-JSON response (${response.status})`,
      response.status,
    )
  }

  if (!envelope.success) {
    if (response.status === 401) {
      onUnauthorized?.()
    }
    throw new ApiClientError(envelope.error.code, envelope.error.message, response.status)
  }

  return envelope.data
}

export function get<T>(path: string): Promise<T> {
  return request<T>(path)
}

export function del<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'DELETE' })
}

export function post<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}
