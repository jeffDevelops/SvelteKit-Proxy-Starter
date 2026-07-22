// Pure, dependency-free credential rules shared by the SvelteKit client
// (immediate field feedback) and the Better Auth hook in apps/api (the
// authoritative enforcement point). The client maps the returned problem
// codes to user-facing copy; the server maps them to error codes. Neither
// human-readable copy nor enumeration lives here.

export const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/
export const USERNAME_MAX_LENGTH = 30

export const MIN_PASSWORD_LENGTH = 8
// Better Auth rejects passwords longer than this; enforce it ourselves so the
// user gets a clear message instead of a generic failure.
export const MAX_PASSWORD_LENGTH = 128

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Names that must never belong to a normal account: impersonation of the
// platform/staff, and paths that read as official surfaces. Compared
// case-insensitively. A caller can't tell "reserved" from "already taken" —
// that's intentional (see UsernameProblem handling).
export const RESERVED_USERNAMES: ReadonlySet<string> = new Set([
  'admin',
  'administrator',
  'root',
  'system',
  'security',
  'staff',
  'team',
  'official',
  'moderator',
  'mod',
  'support',
  'help',
  'billing',
  'payments',
  'payment',
  'authstarter',
  'api',
  'auth',
  'login',
  'signin',
  'signup',
  'logout',
  'settings',
  'about',
])

// Change-email flow landing URLs — a cross-app contract, not a rule: the web
// client passes them as callbackURL, the API recognises the approved leg and
// rewrites it to the completed one when it emails the new address (Better
// Auth reuses the first leg's callbackURL for the second token), and the
// settings page maps the `email-change` stage back to user-facing copy.
export const EMAIL_CHANGE_PARAM = 'email-change'
export const EMAIL_CHANGE_APPROVED_STAGE = 'approved'
export const EMAIL_CHANGE_COMPLETED_STAGE = 'completed'
export const EMAIL_CHANGE_APPROVED_PATH = `/app/settings?${EMAIL_CHANGE_PARAM}=${EMAIL_CHANGE_APPROVED_STAGE}`
export const EMAIL_CHANGE_COMPLETED_PATH = `/app/settings?${EMAIL_CHANGE_PARAM}=${EMAIL_CHANGE_COMPLETED_STAGE}`

// Where the delete-account confirmation link lands after the account is
// soft-deleted (the API's beforeDelete hook redirects here).
export const ACCOUNT_DELETED_PATH = '/app/account-deleted'

export type UsernameProblem = 'required' | 'invalid' | 'too_long' | 'reserved'
export type PasswordProblem = 'required' | 'too_short' | 'too_long'
export type EmailProblem = 'required' | 'invalid'

export function checkUsername(value: string): UsernameProblem | null {
  if (!value) return 'required'
  if (!USERNAME_PATTERN.test(value)) return 'invalid'
  if (value.length > USERNAME_MAX_LENGTH) return 'too_long'
  if (RESERVED_USERNAMES.has(value.toLowerCase())) return 'reserved'
  return null
}

export function checkPassword(value: string): PasswordProblem | null {
  if (!value) return 'required'
  if (value.length < MIN_PASSWORD_LENGTH) return 'too_short'
  if (value.length > MAX_PASSWORD_LENGTH) return 'too_long'
  return null
}

export function checkEmail(value: string): EmailProblem | null {
  if (!value) return 'required'
  if (!EMAIL_PATTERN.test(value)) return 'invalid'
  return null
}
