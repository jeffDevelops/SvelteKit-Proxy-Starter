// Sign-up page (/app/sign-up) — submit-error mapping.
import { RATE_LIMITED_MESSAGE, UNEXPECTED_ERROR_MESSAGE, type AuthError } from './shared'

// Rendered in the sign-up form's alert when the username OR email collides.
// Deliberately ambiguous: never confirms that an account, username, or email
// exists on the platform, and never echoes server-provided error text.
export const SIGN_UP_CONFLICT_MESSAGE =
  'We couldn’t create an account with these details. Please try a different username or email, or sign in if you already have an account.'

const SIGN_UP_CONFLICT_CODES = new Set([
  'USER_ALREADY_EXISTS',
  'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL',
  'USERNAME_UNAVAILABLE',
])

export function signUpErrorMessage(error?: AuthError | null): string | null {
  if (!error) return null
  if (error.status === 429) return RATE_LIMITED_MESSAGE
  if (error.code && SIGN_UP_CONFLICT_CODES.has(error.code)) return SIGN_UP_CONFLICT_MESSAGE
  return UNEXPECTED_ERROR_MESSAGE
}
