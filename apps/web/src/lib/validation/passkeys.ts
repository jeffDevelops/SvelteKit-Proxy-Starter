// Settings → Passkeys card, and the passkey button on /app/sign-in.
import { RATE_LIMITED_MESSAGE, UNEXPECTED_ERROR_MESSAGE, type AuthError } from './shared'

// Passkeys card, after a successful registration.
export const PASSKEY_ADDED_MESSAGE = 'Passkey added. You can use it to sign in from now on.'

// Passkeys card, after removing one.
export const PASSKEY_REMOVED_MESSAGE = 'Passkey removed.'

// Passkeys card, when the authenticator refuses to register twice.
export const PASSKEY_ALREADY_REGISTERED_MESSAGE =
  'This device already has a passkey for your account.'

// Sign-in page, when the passkey ceremony fails for any reason. One message
// for every failure, and it never confirms whether a matching account or
// credential exists — same enumeration stance as password sign-in.
export const PASSKEY_SIGN_IN_FAILED_MESSAGE =
  'We couldn’t sign you in with a passkey. Try again, or use your email and password.'

// The passkey client maps browser WebAuthn outcomes to error codes; a
// cancelled prompt (ERROR_CEREMONY_ABORTED) is a decision, not a failure —
// surfacing an alert for it would nag the user for changing their mind.
export function addPasskeyErrorMessage(error?: AuthError | null): string | null {
  if (!error) return null
  if (error.code === 'ERROR_CEREMONY_ABORTED') return null
  if (error.status === 429) return RATE_LIMITED_MESSAGE
  if (error.code === 'ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED')
    return PASSKEY_ALREADY_REGISTERED_MESSAGE
  return UNEXPECTED_ERROR_MESSAGE
}

export function passkeySignInErrorMessage(error?: AuthError | null): string | null {
  if (!error) return null
  if (error.code === 'ERROR_CEREMONY_ABORTED') return null
  if (error.status === 429) return RATE_LIMITED_MESSAGE
  return PASSKEY_SIGN_IN_FAILED_MESSAGE
}
