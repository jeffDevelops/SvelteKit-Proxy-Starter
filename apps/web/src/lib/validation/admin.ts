// Admin page (/app/admin) — user search + ban/unban. The page itself is
// role-gated in its +page.server.ts; these mappers cover the actions.
import { RATE_LIMITED_MESSAGE, UNEXPECTED_ERROR_MESSAGE, type AuthError } from './shared'

// After banning: sessions are revoked server-side, so "signed out
// everywhere" is literal.
export const USER_BANNED_MESSAGE = 'User banned and signed out everywhere.'
export const USER_UNBANNED_MESSAGE = 'User unbanned. They can sign in again.'

// The API refuses self-bans (YOU_CANNOT_BAN_YOURSELF).
export const ADMIN_CANNOT_BAN_SELF_MESSAGE = 'You can’t ban your own account.'

export function adminActionErrorMessage(error?: AuthError | null): string | null {
  if (!error) return null
  if (error.code === 'YOU_CANNOT_BAN_YOURSELF') return ADMIN_CANNOT_BAN_SELF_MESSAGE
  if (error.status === 429) return RATE_LIMITED_MESSAGE
  return UNEXPECTED_ERROR_MESSAGE
}

// IP bans card — talks to the SvelteKit /api/admin/ip-bans endpoints, whose
// failures carry the standard { error, code, status } envelope.
export const IP_BAN_ADDED_MESSAGE = 'IP banned. It takes effect immediately.'
export const IP_BAN_REMOVED_MESSAGE = 'IP ban lifted.'
export const INVALID_IP_MESSAGE = 'Enter a valid IPv4 or IPv6 address.'
// The SvelteKit endpoint refuses to ban the address the admin is currently
// connecting from — the same address the enforcement middleware would see.
export const CANNOT_BAN_OWN_IP_MESSAGE =
  'That’s the address you’re connecting from — banning it could lock you out.'

export function ipBanErrorMessage(code?: string | null): string | null {
  if (code === null || code === undefined) return null
  if (code === 'INVALID_IP_BAN') return INVALID_IP_MESSAGE
  if (code === 'CANNOT_BAN_OWN_IP') return CANNOT_BAN_OWN_IP_MESSAGE
  return UNEXPECTED_ERROR_MESSAGE
}
