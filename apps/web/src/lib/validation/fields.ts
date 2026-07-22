// Field-level validators for ValidatedField — errors render under the input
// they belong to (blur-gated: only after the user leaves the field).
import {
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  USERNAME_MAX_LENGTH,
  checkEmail,
  checkPassword,
  checkUsername,
} from '@auth-starter/validation'

// Username field: sign-up form and settings → Username card.
export const USERNAME_REQUIRED_MESSAGE = 'Username is required'
export const USERNAME_INVALID_MESSAGE =
  'Username can only contain letters, numbers, and underscores'
export const USERNAME_TOO_LONG_MESSAGE = `Username must be ${USERNAME_MAX_LENGTH} characters or fewer`
// Reserved names reuse the same copy as a taken name so we don't reveal the
// blocklist or confirm anything about who exists on the platform. Also used
// by updateUsernameErrorMessage for the server-side USERNAME_UNAVAILABLE.
export const USERNAME_UNAVAILABLE_MESSAGE = 'That username isn’t available'

// Email field: sign-up, sign-in, forgot-password, settings → Email card.
export const EMAIL_REQUIRED_MESSAGE = 'Email is required'
export const EMAIL_INVALID_MESSAGE = 'Enter a valid email address'

// Password field: sign-up, reset-password, settings → Password card (new).
export const PASSWORD_REQUIRED_MESSAGE = 'Password is required'
export const PASSWORD_TOO_SHORT_MESSAGE = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
export const PASSWORD_TOO_LONG_MESSAGE = `Password must be ${MAX_PASSWORD_LENGTH} characters or fewer`

export function validateUsername(value: string): string | null {
  switch (checkUsername(value)) {
    case 'required':
      return USERNAME_REQUIRED_MESSAGE
    case 'invalid':
      return USERNAME_INVALID_MESSAGE
    case 'too_long':
      return USERNAME_TOO_LONG_MESSAGE
    case 'reserved':
      return USERNAME_UNAVAILABLE_MESSAGE
    default:
      return null
  }
}

export function validateEmail(value: string): string | null {
  switch (checkEmail(value)) {
    case 'required':
      return EMAIL_REQUIRED_MESSAGE
    case 'invalid':
      return EMAIL_INVALID_MESSAGE
    default:
      return null
  }
}

export function validatePassword(value: string): string | null {
  switch (checkPassword(value)) {
    case 'required':
      return PASSWORD_REQUIRED_MESSAGE
    case 'too_short':
      return PASSWORD_TOO_SHORT_MESSAGE
    case 'too_long':
      return PASSWORD_TOO_LONG_MESSAGE
    default:
      return null
  }
}

// Existing-password fields only require a value (sign-in, and every settings
// re-prompt: change/2FA/delete). Surfacing the length policy here would be
// wrong the moment the sign-up policy changes under existing accounts.
export function validateSignInPassword(value: string): string | null {
  if (!value) return PASSWORD_REQUIRED_MESSAGE
  return null
}
