// Settings → Email card: the two-legged change-email flow.
import {
  EMAIL_CHANGE_APPROVED_STAGE,
  EMAIL_CHANGE_COMPLETED_STAGE,
  EMAIL_CHANGE_PARAM,
} from '@auth-starter/validation'

// Email card, when the typed address is already the account's address
// (checked locally, before any API call).
export const EMAIL_SAME_MESSAGE = 'That is already your email address.'

// Email card, right after submitting. Better Auth sends the confirmation to
// the current address when it's verified (so a hijacked session can't move
// the account), and to the new address otherwise.
export const emailChangeRequestedMessage = (destination: string) =>
  `Almost done — we sent a confirmation link to ${destination}.`
export const emailChangeApprovalRequestedMessage = (currentEmail: string) =>
  `To protect your account, we sent an approval link to ${currentEmail}. ` +
  `Once you approve, we'll email a verification link to your new address.`

// The links in those emails redirect back to /app/settings with an
// `email-change` stage (or a Better Auth `error`) in the query string; the
// Email card maps the stage to one of these on load.
export const EMAIL_CHANGE_APPROVED_MESSAGE =
  'Change approved. We sent a verification link to your new address — your email updates once you confirm from there.'
export const EMAIL_CHANGE_COMPLETED_MESSAGE = 'Your email address has been updated.'
export const EMAIL_CHANGE_LINK_INVALID_MESSAGE =
  'That email change link is invalid or has expired. Request the change again below.'

export function emailChangeLandingStatus(params: URLSearchParams): {
  status: string | null
  error: string | null
} {
  const stage = params.get(EMAIL_CHANGE_PARAM)
  if (stage === null) return { status: null, error: null }
  if (params.get('error')) return { status: null, error: EMAIL_CHANGE_LINK_INVALID_MESSAGE }
  if (stage === EMAIL_CHANGE_APPROVED_STAGE)
    return { status: EMAIL_CHANGE_APPROVED_MESSAGE, error: null }
  if (stage === EMAIL_CHANGE_COMPLETED_STAGE)
    return { status: EMAIL_CHANGE_COMPLETED_MESSAGE, error: null }
  return { status: null, error: null }
}
