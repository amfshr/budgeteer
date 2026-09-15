import { get, post } from '@/api/client'

/** Mirrors the server's AuthResponse record (api/v1/auth/dto). */
export interface AuthResponse {
  message: string
  email: string | null
  accessToken: string | null
  refreshToken: string | null
}

/** Mirrors the server's UserResponse record. */
export interface User {
  id: string
  email: string
  emailVerified: boolean
  createdAt: string
}

export function requestMagicLink(email: string): Promise<AuthResponse> {
  return post<AuthResponse>('/api/v1/auth/login', { email })
}

/**
 * One-shot: marks the token used server-side and sets the session cookies.
 * The client's Accept: application/json selects the JSON branch of the
 * content-negotiated endpoint (browsers hitting the URL directly get a 302).
 */
export function verifyMagicLink(token: string): Promise<AuthResponse> {
  return get<AuthResponse>(`/api/v1/auth/verify?token=${encodeURIComponent(token)}`)
}

export function fetchCurrentUser(): Promise<User> {
  return get<User>('/api/v1/auth/me')
}

export function logout(): Promise<AuthResponse> {
  return post<AuthResponse>('/api/v1/auth/logout')
}
