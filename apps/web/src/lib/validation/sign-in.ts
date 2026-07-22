// Sign-in page (/app/sign-in) — submit-error mapping for the email +
// password form. Passkey sign-in has its own mapper in ./passkeys.
import { RATE_LIMITED_MESSAGE, UNEXPECTED_ERROR_MESSAGE, type AuthError } from './shared'

// Rendered in the sign-in form's alert. Identical for wrong-password and
// unknown-email, so it can't confirm whether an account exists — and it's
// also what a soft-deleted account sees (the API answers with the same code).
export const SIGN_IN_FAILED_MESSAGE = 'Incorrect email or password.'

// Sign-in page, when the admin plugin rejects a banned account (correct
// password, so telling the account owner the truth leaks nothing).
export const ACCOUNT_SUSPENDED_MESSAGE =
  'This account has been suspended. Contact support if you believe this is a mistake.'

export function signInErrorMessage(error?: AuthError | null): string | null {
  if (!error) return null
  if (error.status === 429) return RATE_LIMITED_MESSAGE
  if (error.code === 'INVALID_EMAIL_OR_PASSWORD') return SIGN_IN_FAILED_MESSAGE
  if (error.code === 'BANNED_USER') return ACCOUNT_SUSPENDED_MESSAGE
  return UNEXPECTED_ERROR_MESSAGE
}
