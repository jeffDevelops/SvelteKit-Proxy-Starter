// Settings → Username and Password cards.
import { USERNAME_INVALID_MESSAGE, USERNAME_UNAVAILABLE_MESSAGE } from './fields'
import { RATE_LIMITED_MESSAGE, UNEXPECTED_ERROR_MESSAGE, type AuthError } from './shared'

// Username card, after a successful rename.
export const USERNAME_UPDATED_MESSAGE = 'Username updated.'

// Password card, after a successful change.
export const PASSWORD_CHANGED_MESSAGE = 'Password changed. Your other devices have been signed out.'

// Shared by every settings flow that re-prompts for the account password:
// Password card, Two-factor card (enable/disable), and Delete-account card.
export const CURRENT_PASSWORD_INCORRECT_MESSAGE = 'Your current password is incorrect.'

export function updateUsernameErrorMessage(error?: AuthError | null): string | null {
  if (!error) return null
  if (error.status === 429) return RATE_LIMITED_MESSAGE
  if (error.code === 'USERNAME_UNAVAILABLE') return USERNAME_UNAVAILABLE_MESSAGE
  if (error.code === 'INVALID_USERNAME') return USERNAME_INVALID_MESSAGE
  return UNEXPECTED_ERROR_MESSAGE
}

export function changePasswordErrorMessage(error?: AuthError | null): string | null {
  if (!error) return null
  if (error.status === 429) return RATE_LIMITED_MESSAGE
  if (error.code === 'INVALID_PASSWORD') return CURRENT_PASSWORD_INCORRECT_MESSAGE
  return UNEXPECTED_ERROR_MESSAGE
}
