import { describe, expect, it } from 'vitest'
import {
  ACCOUNT_SUSPENDED_MESSAGE,
  ADMIN_CANNOT_BAN_SELF_MESSAGE,
  CANNOT_BAN_OWN_IP_MESSAGE,
  CURRENT_PASSWORD_INCORRECT_MESSAGE,
  INVALID_IP_MESSAGE,
  EMAIL_CHANGE_APPROVED_MESSAGE,
  EMAIL_CHANGE_COMPLETED_MESSAGE,
  EMAIL_CHANGE_LINK_INVALID_MESSAGE,
  EMAIL_INVALID_MESSAGE,
  EMAIL_REQUIRED_MESSAGE,
  PASSKEY_ALREADY_REGISTERED_MESSAGE,
  PASSKEY_SIGN_IN_FAILED_MESSAGE,
  PASSWORD_REQUIRED_MESSAGE,
  PASSWORD_TOO_LONG_MESSAGE,
  PASSWORD_TOO_SHORT_MESSAGE,
  RATE_LIMITED_MESSAGE,
  RESET_LINK_INVALID_MESSAGE,
  RESET_LINK_SENT_MESSAGE,
  SIGN_IN_FAILED_MESSAGE,
  SIGN_UP_CONFLICT_MESSAGE,
  TWO_FACTOR_CODE_INVALID_MESSAGE,
  TWO_FACTOR_LOCKED_MESSAGE,
  UNEXPECTED_ERROR_MESSAGE,
  USERNAME_INVALID_MESSAGE,
  USERNAME_REQUIRED_MESSAGE,
  USERNAME_TOO_LONG_MESSAGE,
  USERNAME_UNAVAILABLE_MESSAGE,
  addPasskeyErrorMessage,
  adminActionErrorMessage,
  deleteAccountErrorMessage,
  ipBanErrorMessage,
  passkeySignInErrorMessage,
  sessionsErrorMessage,
  signInErrorMessage,
  twoFactorPasswordErrorMessage,
  twoFactorVerifyErrorMessage,
  signUpErrorMessage,
  validateEmail,
  changePasswordErrorMessage,
  emailChangeLandingStatus,
  resetPasswordErrorMessage,
  updateUsernameErrorMessage,
  validatePassword,
  validateSignInPassword,
  validateUsername,
} from './index'
import { MAX_PASSWORD_LENGTH, USERNAME_MAX_LENGTH } from '@auth-starter/validation'

describe('validateUsername', () => {
  it('rejects an empty username', () => {
    expect(validateUsername('')).toBe(USERNAME_REQUIRED_MESSAGE)
  })

  it('rejects a username with disallowed characters', () => {
    expect(validateUsername('not a valid username!')).toBe(USERNAME_INVALID_MESSAGE)
  })

  it('accepts letters, numbers, and underscores', () => {
    expect(validateUsername('valid_username_123')).toBeNull()
  })

  it('rejects a username longer than the maximum length', () => {
    expect(validateUsername('a'.repeat(USERNAME_MAX_LENGTH + 1))).toBe(USERNAME_TOO_LONG_MESSAGE)
  })

  it('rejects a reserved username without revealing that it is reserved', () => {
    expect(validateUsername('admin')).toBe(USERNAME_UNAVAILABLE_MESSAGE)
    expect(USERNAME_UNAVAILABLE_MESSAGE).not.toMatch(/reserved|blocked|forbidden|system/i)
  })

  it('treats reserved usernames case-insensitively', () => {
    expect(validateUsername('Admin')).toBe(USERNAME_UNAVAILABLE_MESSAGE)
    expect(validateUsername('AUTHSTARTER')).toBe(USERNAME_UNAVAILABLE_MESSAGE)
  })
})

describe('validateEmail', () => {
  it('rejects an empty email', () => {
    expect(validateEmail('')).toBe(EMAIL_REQUIRED_MESSAGE)
  })

  it('rejects a malformed email', () => {
    expect(validateEmail('not-an-email')).toBe(EMAIL_INVALID_MESSAGE)
  })

  it('accepts a well-formed email', () => {
    expect(validateEmail('jeff@example.com')).toBeNull()
  })
})

describe('validateSignInPassword', () => {
  it('rejects an empty password', () => {
    expect(validateSignInPassword('')).toBe(PASSWORD_REQUIRED_MESSAGE)
  })

  it('accepts any non-empty password without enforcing the sign-up policy', () => {
    expect(validateSignInPassword('short')).toBeNull()
    expect(validateSignInPassword('password123')).toBeNull()
  })
})

describe('signInErrorMessage', () => {
  it('returns null when there is no error', () => {
    expect(signInErrorMessage(null)).toBeNull()
    expect(signInErrorMessage(undefined)).toBeNull()
  })

  it('maps invalid credentials to a message that does not say which part was wrong', () => {
    expect(signInErrorMessage({ code: 'INVALID_EMAIL_OR_PASSWORD' })).toBe(SIGN_IN_FAILED_MESSAGE)
  })

  it('tells a banned user their account is suspended without echoing server text', () => {
    const message = signInErrorMessage({
      code: 'BANNED_USER',
      message: 'You have been banned from this application',
      status: 403,
    })
    expect(message).toBe(ACCOUNT_SUSPENDED_MESSAGE)
    expect(message).not.toMatch(/banned from this application/)
  })

  it('maps unrecognized errors to the generic unexpected message', () => {
    expect(signInErrorMessage({ code: 'FAILED_TO_CREATE_SESSION' })).toBe(UNEXPECTED_ERROR_MESSAGE)
    expect(signInErrorMessage({})).toBe(UNEXPECTED_ERROR_MESSAGE)
    expect(signInErrorMessage({ status: 500 })).toBe(UNEXPECTED_ERROR_MESSAGE)
  })

  it('never passes server-provided message text through to the user', () => {
    const result = signInErrorMessage({
      code: 'INVALID_EMAIL_OR_PASSWORD',
      message: 'No user found for kalman@example.com',
    })
    expect(result).not.toContain('No user found')
    expect(result).not.toContain('kalman')
  })

  it('does not confirm or deny account existence', () => {
    expect(SIGN_IN_FAILED_MESSAGE).not.toMatch(
      /no account|not found|does not exist|already exists|unknown user/i,
    )
  })
})

describe('signUpErrorMessage', () => {
  it('returns null when there is no error', () => {
    expect(signUpErrorMessage(null)).toBeNull()
    expect(signUpErrorMessage(undefined)).toBeNull()
  })

  it('maps a duplicate-email error to the generic conflict message', () => {
    expect(signUpErrorMessage({ code: 'USER_ALREADY_EXISTS' })).toBe(SIGN_UP_CONFLICT_MESSAGE)
    expect(signUpErrorMessage({ code: 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL' })).toBe(
      SIGN_UP_CONFLICT_MESSAGE,
    )
  })

  it('maps a duplicate-username error to the generic conflict message', () => {
    expect(signUpErrorMessage({ code: 'USERNAME_UNAVAILABLE' })).toBe(SIGN_UP_CONFLICT_MESSAGE)
  })

  it('maps unrecognized error codes to the generic unexpected message', () => {
    expect(signUpErrorMessage({ code: 'FAILED_TO_CREATE_USER' })).toBe(UNEXPECTED_ERROR_MESSAGE)
  })

  it('maps errors without a code (network/server failures) to the generic unexpected message', () => {
    expect(signUpErrorMessage({})).toBe(UNEXPECTED_ERROR_MESSAGE)
    expect(signUpErrorMessage({ status: 500 })).toBe(UNEXPECTED_ERROR_MESSAGE)
  })

  it('never passes server-provided message text through to the user', () => {
    const result = signUpErrorMessage({
      code: 'USER_ALREADY_EXISTS',
      message: 'User already exists: kalman <kalman@example.com>',
    })
    expect(result).not.toContain('already exists')
    expect(result).not.toContain('kalman')
  })

  it('does not confirm account existence in any surfaced message', () => {
    for (const message of [SIGN_UP_CONFLICT_MESSAGE, UNEXPECTED_ERROR_MESSAGE]) {
      expect(message).not.toMatch(/already exists|already registered|taken|in use|unavailable/i)
    }
  })

  it('does not surface implementation details in any surfaced message', () => {
    for (const message of [SIGN_UP_CONFLICT_MESSAGE, UNEXPECTED_ERROR_MESSAGE]) {
      expect(message).not.toMatch(/sql|database|constraint|unique|index|drizzle|postgres|hono/i)
    }
  })
})

describe('validatePassword', () => {
  it('rejects an empty password', () => {
    expect(validatePassword('')).toBe(PASSWORD_REQUIRED_MESSAGE)
  })

  it('rejects a password shorter than 8 characters', () => {
    expect(validatePassword('short')).toBe(PASSWORD_TOO_SHORT_MESSAGE)
  })

  it('accepts a password of 8 or more characters', () => {
    expect(validatePassword('password123')).toBeNull()
  })

  it('rejects a password longer than the maximum length', () => {
    expect(validatePassword('a'.repeat(MAX_PASSWORD_LENGTH + 1))).toBe(PASSWORD_TOO_LONG_MESSAGE)
  })

  it('accepts a password exactly at the maximum length', () => {
    expect(validatePassword('a'.repeat(MAX_PASSWORD_LENGTH))).toBeNull()
  })
})

describe('resetPasswordErrorMessage', () => {
  it('returns null when there is no error', () => {
    expect(resetPasswordErrorMessage(null)).toBeNull()
    expect(resetPasswordErrorMessage(undefined)).toBeNull()
  })

  it('maps an invalid or expired token to the reset-link message', () => {
    expect(resetPasswordErrorMessage({ code: 'INVALID_TOKEN', status: 400 })).toBe(
      RESET_LINK_INVALID_MESSAGE,
    )
  })

  it('falls back to the generic message and never echoes server text', () => {
    const message = resetPasswordErrorMessage({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'verification row missing',
      status: 500,
    })
    expect(message).toBe(UNEXPECTED_ERROR_MESSAGE)
    expect(message).not.toContain('verification')
  })

  it('keeps the sent message enumeration-safe', () => {
    expect(RESET_LINK_SENT_MESSAGE).toMatch(/if an account exists/i)
    expect(RESET_LINK_SENT_MESSAGE).not.toMatch(/already exists|taken|in use|unavailable/i)
  })
})

describe('updateUsernameErrorMessage', () => {
  it('returns null when there is no error', () => {
    expect(updateUsernameErrorMessage(null)).toBeNull()
  })

  it('maps unavailable and invalid usernames to the shared field copy', () => {
    expect(updateUsernameErrorMessage({ code: 'USERNAME_UNAVAILABLE' })).toBe(
      USERNAME_UNAVAILABLE_MESSAGE,
    )
    expect(updateUsernameErrorMessage({ code: 'INVALID_USERNAME' })).toBe(USERNAME_INVALID_MESSAGE)
  })

  it('maps everything else to the generic message', () => {
    expect(updateUsernameErrorMessage({ code: 'FAILED_TO_UPDATE_USER' })).toBe(
      UNEXPECTED_ERROR_MESSAGE,
    )
  })
})

describe('changePasswordErrorMessage', () => {
  it('returns null when there is no error', () => {
    expect(changePasswordErrorMessage(null)).toBeNull()
  })

  it('tells the user when the current password is wrong', () => {
    expect(changePasswordErrorMessage({ code: 'INVALID_PASSWORD' })).toBe(
      CURRENT_PASSWORD_INCORRECT_MESSAGE,
    )
  })

  it('maps everything else to the generic message without echoing server text', () => {
    const message = changePasswordErrorMessage({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'argon2 failure',
    })
    expect(message).toBe(UNEXPECTED_ERROR_MESSAGE)
    expect(message).not.toContain('argon2')
  })
})

// The passkey client surfaces browser WebAuthn outcomes as error codes:
// a cancelled prompt is ERROR_CEREMONY_ABORTED (not a failure — the user
// changed their mind), a re-registered device is
// ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED.
describe('addPasskeyErrorMessage', () => {
  it('returns null when there is no error', () => {
    expect(addPasskeyErrorMessage(null)).toBeNull()
    expect(addPasskeyErrorMessage(undefined)).toBeNull()
  })

  it('stays silent when the user cancels the browser prompt', () => {
    expect(addPasskeyErrorMessage({ code: 'ERROR_CEREMONY_ABORTED', status: 400 })).toBeNull()
  })

  it('explains when this device already holds a passkey for the account', () => {
    expect(
      addPasskeyErrorMessage({ code: 'ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED', status: 400 }),
    ).toBe(PASSKEY_ALREADY_REGISTERED_MESSAGE)
  })

  it('maps everything else to the generic message without echoing server text', () => {
    const message = addPasskeyErrorMessage({
      code: 'FAILED_TO_VERIFY_REGISTRATION',
      message: 'challenge mismatch in verify-registration',
    })
    expect(message).toBe(UNEXPECTED_ERROR_MESSAGE)
    expect(message).not.toContain('challenge')
  })
})

describe('passkeySignInErrorMessage', () => {
  it('returns null when there is no error', () => {
    expect(passkeySignInErrorMessage(null)).toBeNull()
    expect(passkeySignInErrorMessage(undefined)).toBeNull()
  })

  it('stays silent when the user cancels the browser prompt', () => {
    expect(passkeySignInErrorMessage({ code: 'ERROR_CEREMONY_ABORTED', status: 400 })).toBeNull()
  })

  it('maps failures to one passkey message that suggests the password fallback', () => {
    const message = passkeySignInErrorMessage({
      code: 'UNABLE_TO_VERIFY_AUTHENTICATION',
      message: 'credential abc123 not found for rpID',
      status: 401,
    })
    expect(message).toBe(PASSKEY_SIGN_IN_FAILED_MESSAGE)
    expect(message).toMatch(/password/i)
    expect(message).not.toContain('abc123')
  })

  it('never confirms whether an account or credential exists', () => {
    expect(PASSKEY_SIGN_IN_FAILED_MESSAGE).not.toMatch(/no account|not found|unknown|exists/i)
  })
})

// Enable/disable both re-prompt for the account password; verification
// covers TOTP and backup codes with one indistinguishable failure message.
describe('twoFactorPasswordErrorMessage', () => {
  it('returns null when there is no error', () => {
    expect(twoFactorPasswordErrorMessage(null)).toBeNull()
    expect(twoFactorPasswordErrorMessage(undefined)).toBeNull()
  })

  it('reuses the incorrect-password copy from the password card', () => {
    expect(twoFactorPasswordErrorMessage({ code: 'INVALID_PASSWORD', status: 400 })).toBe(
      CURRENT_PASSWORD_INCORRECT_MESSAGE,
    )
  })

  it('maps everything else to the generic message without echoing server text', () => {
    const message = twoFactorPasswordErrorMessage({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'twoFactor row missing',
    })
    expect(message).toBe(UNEXPECTED_ERROR_MESSAGE)
    expect(message).not.toContain('twoFactor')
  })
})

describe('twoFactorVerifyErrorMessage', () => {
  it('returns null when there is no error', () => {
    expect(twoFactorVerifyErrorMessage(null)).toBeNull()
    expect(twoFactorVerifyErrorMessage(undefined)).toBeNull()
  })

  it('maps wrong TOTP and wrong backup codes to the same message', () => {
    expect(twoFactorVerifyErrorMessage({ code: 'INVALID_CODE', status: 401 })).toBe(
      TWO_FACTOR_CODE_INVALID_MESSAGE,
    )
    expect(twoFactorVerifyErrorMessage({ code: 'INVALID_BACKUP_CODE', status: 401 })).toBe(
      TWO_FACTOR_CODE_INVALID_MESSAGE,
    )
  })

  it('tells the user when verification is temporarily locked', () => {
    expect(twoFactorVerifyErrorMessage({ code: 'ACCOUNT_TEMPORARILY_LOCKED', status: 429 })).toBe(
      TWO_FACTOR_LOCKED_MESSAGE,
    )
  })

  it('maps everything else to the generic message without echoing server text', () => {
    const message = twoFactorVerifyErrorMessage({
      code: 'INVALID_TWO_FACTOR_COOKIE',
      message: 'invalid two factor cookie',
    })
    expect(message).toBe(UNEXPECTED_ERROR_MESSAGE)
    expect(message).not.toContain('cookie')
  })
})

describe('deleteAccountErrorMessage', () => {
  it('returns null when there is no error', () => {
    expect(deleteAccountErrorMessage(null)).toBeNull()
    expect(deleteAccountErrorMessage(undefined)).toBeNull()
  })

  it('reuses the incorrect-password copy for a wrong password', () => {
    expect(deleteAccountErrorMessage({ code: 'INVALID_PASSWORD', status: 400 })).toBe(
      CURRENT_PASSWORD_INCORRECT_MESSAGE,
    )
  })

  it('maps everything else to the generic message without echoing server text', () => {
    const message = deleteAccountErrorMessage({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'delete-account token table unavailable',
      status: 500,
    })
    expect(message).toBe(UNEXPECTED_ERROR_MESSAGE)
    expect(message).not.toContain('token table')
  })
})

describe('ipBanErrorMessage', () => {
  it('returns null when there is no error code', () => {
    expect(ipBanErrorMessage(null)).toBeNull()
    expect(ipBanErrorMessage(undefined)).toBeNull()
  })

  it('asks for a valid address when the API rejects the IP', () => {
    expect(ipBanErrorMessage('INVALID_IP_BAN')).toBe(INVALID_IP_MESSAGE)
  })

  it('explains the self-IP guard', () => {
    expect(ipBanErrorMessage('CANNOT_BAN_OWN_IP')).toBe(CANNOT_BAN_OWN_IP_MESSAGE)
  })

  it('maps everything else to the generic message', () => {
    expect(ipBanErrorMessage('INTERNAL_ERROR')).toBe(UNEXPECTED_ERROR_MESSAGE)
  })
})

// Admin page (/app/admin) — ban/unban actions.
describe('adminActionErrorMessage', () => {
  it('returns null when there is no error', () => {
    expect(adminActionErrorMessage(null)).toBeNull()
    expect(adminActionErrorMessage(undefined)).toBeNull()
  })

  it('explains the self-ban guard', () => {
    expect(adminActionErrorMessage({ code: 'YOU_CANNOT_BAN_YOURSELF', status: 400 })).toBe(
      ADMIN_CANNOT_BAN_SELF_MESSAGE,
    )
  })

  it('maps everything else to the generic message without echoing server text', () => {
    const message = adminActionErrorMessage({
      code: 'YOU_ARE_NOT_ALLOWED_TO_BAN_USERS',
      message: 'You are not allowed to ban users',
      status: 403,
    })
    expect(message).toBe(UNEXPECTED_ERROR_MESSAGE)
    expect(message).not.toContain('allowed to ban')
  })
})

describe('sessionsErrorMessage', () => {
  it('returns null when there is no error', () => {
    expect(sessionsErrorMessage(null)).toBeNull()
    expect(sessionsErrorMessage(undefined)).toBeNull()
  })

  it('maps every failure to the generic message without echoing server text', () => {
    const message = sessionsErrorMessage({
      code: 'FAILED_TO_GET_SESSION',
      message: 'session token xyz not found',
      status: 500,
    })
    expect(message).toBe(UNEXPECTED_ERROR_MESSAGE)
    expect(message).not.toContain('xyz')
  })
})

// Better Auth answers over-limit requests with a bare 429 — no error code —
// so every mapper keys off status. One shared message for all flows: copy
// that names the limited flow or its threshold helps an attacker tune.
describe('rate-limited error mapping', () => {
  const rateLimited = { status: 429, statusText: 'Too Many Requests' }

  it('maps 429 to the rate-limited message in every auth error mapper', () => {
    for (const mapper of [
      signInErrorMessage,
      signUpErrorMessage,
      resetPasswordErrorMessage,
      updateUsernameErrorMessage,
      changePasswordErrorMessage,
      addPasskeyErrorMessage,
      adminActionErrorMessage,
      deleteAccountErrorMessage,
      passkeySignInErrorMessage,
      sessionsErrorMessage,
      twoFactorPasswordErrorMessage,
      twoFactorVerifyErrorMessage,
    ]) {
      expect(mapper(rateLimited)).toBe(RATE_LIMITED_MESSAGE)
    }
  })

  it('never echoes the server-provided 429 body text', () => {
    const message = signInErrorMessage({
      ...rateLimited,
      message: 'Too many requests. Please try again later.',
    })
    expect(message).toBe(RATE_LIMITED_MESSAGE)
  })

  it('does not reveal thresholds, windows, or the limiting mechanism', () => {
    expect(RATE_LIMITED_MESSAGE).not.toMatch(/\d|rate.?limit|ip\b|window|second/i)
  })
})

// The change-email links redirect back to /app/settings with an
// `email-change` stage (or an `error` from Better Auth) in the query string.
describe('emailChangeLandingStatus', () => {
  it('is inert on a plain settings visit', () => {
    expect(emailChangeLandingStatus(new URLSearchParams())).toEqual({
      status: null,
      error: null,
    })
  })

  it('explains the second step after the approval link is clicked', () => {
    expect(emailChangeLandingStatus(new URLSearchParams('email-change=approved'))).toEqual({
      status: EMAIL_CHANGE_APPROVED_MESSAGE,
      error: null,
    })
  })

  it('confirms completion after the new address is verified', () => {
    expect(emailChangeLandingStatus(new URLSearchParams('email-change=completed'))).toEqual({
      status: EMAIL_CHANGE_COMPLETED_MESSAGE,
      error: null,
    })
  })

  it('reports an invalid or expired link instead of a stage', () => {
    expect(
      emailChangeLandingStatus(new URLSearchParams('email-change=approved&error=INVALID_TOKEN')),
    ).toEqual({ status: null, error: EMAIL_CHANGE_LINK_INVALID_MESSAGE })
  })

  it('ignores unknown stages', () => {
    expect(emailChangeLandingStatus(new URLSearchParams('email-change=bogus'))).toEqual({
      status: null,
      error: null,
    })
  })
})
