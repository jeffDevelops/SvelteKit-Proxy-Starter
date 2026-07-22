// Settings → Two-factor card, and the /app/two-factor challenge page.
import { CURRENT_PASSWORD_INCORRECT_MESSAGE } from './account'
import { RATE_LIMITED_MESSAGE, UNEXPECTED_ERROR_MESSAGE, type AuthError } from './shared'

// Two-factor card, after the enrollment code verifies.
export const TWO_FACTOR_ENABLED_MESSAGE =
  'Two-factor authentication is on. Store your backup codes somewhere safe — each one works once.'

// Two-factor card, after disabling with the account password.
export const TWO_FACTOR_DISABLED_MESSAGE = 'Two-factor authentication is off.'

// Two-factor card (enrollment confirm) and the challenge page. Wrong TOTP
// and wrong backup code map to the same copy so a stolen-password attacker
// probing the challenge page learns nothing about either channel.
export const TWO_FACTOR_CODE_INVALID_MESSAGE = 'That code didn’t work. Try again.'

// Challenge page, when Better Auth locks verification after repeated
// failures; the copy doesn't name the threshold or the lockout duration.
export const TWO_FACTOR_LOCKED_MESSAGE =
  'Too many failed attempts. Wait a few minutes, then try again.'

// Enable and disable both re-prompt for the account password.
export function twoFactorPasswordErrorMessage(error?: AuthError | null): string | null {
  if (!error) return null
  if (error.code === 'INVALID_PASSWORD') return CURRENT_PASSWORD_INCORRECT_MESSAGE
  if (error.status === 429) return RATE_LIMITED_MESSAGE
  return UNEXPECTED_ERROR_MESSAGE
}

export function twoFactorVerifyErrorMessage(error?: AuthError | null): string | null {
  if (!error) return null
  if (error.code === 'INVALID_CODE' || error.code === 'INVALID_BACKUP_CODE')
    return TWO_FACTOR_CODE_INVALID_MESSAGE
  if (
    error.code === 'ACCOUNT_TEMPORARILY_LOCKED' ||
    error.code === 'TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE'
  )
    return TWO_FACTOR_LOCKED_MESSAGE
  if (error.status === 429) return RATE_LIMITED_MESSAGE
  return UNEXPECTED_ERROR_MESSAGE
}
