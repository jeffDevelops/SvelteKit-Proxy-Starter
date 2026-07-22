// Copy and helpers shared by every auth-flow error mapper.

/** Shape of Better Auth client errors as the mappers consume them. */
export type AuthError = {
  code?: string
  message?: string
  status?: number
  statusText?: string
}

// Fallback for any failure a mapper doesn't recognize. Rendered wherever a
// mapper is used; deliberately says nothing about what went wrong — raw
// server error text must never reach the page.
export const UNEXPECTED_ERROR_MESSAGE =
  'Something went wrong on our end. Please try again in a moment.'

// Better Auth answers over-limit requests with a bare 429 (no error code), so
// mappers key off status. Shared copy across flows: naming the limited flow
// or its threshold would help an attacker tune around the limiter.
export const RATE_LIMITED_MESSAGE = 'Too many attempts. Please wait a moment and try again.'
