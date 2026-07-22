// Forgot-password (/app/forgot-password) and reset-password
// (/app/reset-password) pages.
import { RATE_LIMITED_MESSAGE, UNEXPECTED_ERROR_MESSAGE, type AuthError } from './shared'

// Forgot-password page, after submitting an address. Enumeration-safe:
// shown whether or not the email has an account (the API responds
// identically either way).
export const RESET_LINK_SENT_MESSAGE =
  'If an account exists for that email, we’ve sent a password reset link. It expires in one hour.'

// Reset-password page, when it loads without a token, with an ?error= from
// Better Auth, or when the API rejects the token on submit.
export const RESET_LINK_INVALID_MESSAGE =
  'This password reset link is invalid or has expired. Request a new one.'

// Reset-password page, after the new password is accepted.
export const PASSWORD_RESET_SUCCESS_MESSAGE =
  'Your password has been reset. Sign in with your new password.'

export function resetPasswordErrorMessage(error?: AuthError | null): string | null {
  if (!error) return null
  if (error.status === 429) return RATE_LIMITED_MESSAGE
  if (error.code === 'INVALID_TOKEN') return RESET_LINK_INVALID_MESSAGE
  return UNEXPECTED_ERROR_MESSAGE
}
