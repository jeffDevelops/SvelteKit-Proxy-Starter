// Settings → Devices card.
import { RATE_LIMITED_MESSAGE, UNEXPECTED_ERROR_MESSAGE, type AuthError } from './shared'

// Devices card, after revoking one session.
export const SESSION_REVOKED_MESSAGE = 'That device has been signed out.'

// Devices card, after "Sign out other devices".
export const OTHER_SESSIONS_REVOKED_MESSAGE = 'All other devices have been signed out.'

export function sessionsErrorMessage(error?: AuthError | null): string | null {
  if (!error) return null
  if (error.status === 429) return RATE_LIMITED_MESSAGE
  return UNEXPECTED_ERROR_MESSAGE
}
