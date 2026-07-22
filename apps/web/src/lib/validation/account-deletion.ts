// Settings → Delete-account card. The goodbye page itself
// (/app/account-deleted) is static copy.
import { CURRENT_PASSWORD_INCORRECT_MESSAGE } from './account'
import { RATE_LIMITED_MESSAGE, UNEXPECTED_ERROR_MESSAGE, type AuthError } from './shared'

// Delete-account card, after the request is accepted. Nothing is deleted
// yet — only the emailed confirmation link soft-deletes the account.
export const DELETE_ACCOUNT_EMAIL_SENT_MESSAGE =
  'Check your email — your account will be deleted once you confirm from the link we sent.'

export function deleteAccountErrorMessage(error?: AuthError | null): string | null {
  if (!error) return null
  if (error.code === 'INVALID_PASSWORD') return CURRENT_PASSWORD_INCORRECT_MESSAGE
  if (error.status === 429) return RATE_LIMITED_MESSAGE
  return UNEXPECTED_ERROR_MESSAGE
}
