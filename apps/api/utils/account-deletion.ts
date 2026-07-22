import type { EmailMessage } from '@auth-starter/email'
import { APIError } from 'better-auth/api'
import { ACCOUNT_DELETED_PATH } from '@auth-starter/validation'

interface Recipient {
  name: string
  email: string
}

// Sent by Better Auth's deleteUser flow; clicking the link runs the
// beforeDelete hook, which soft-deletes and aborts the built-in hard delete.
export function deleteAccountEmail(user: Recipient, url: string): EmailMessage {
  return {
    to: user.email,
    subject: 'Confirm deletion of your auth-starter account',
    text:
      `Hi ${user.name},\n\n` +
      `Someone asked us to delete your auth-starter account. If this was you, ` +
      `confirm it here within the next 24 hours:\n\n${url}\n\n` +
      `This signs you out everywhere and closes the account. If you change ` +
      `your mind afterwards, contact support — accounts can be restored for ` +
      `a limited time.\n\n` +
      `If you didn't request this, you can safely ignore this email and ` +
      `consider changing your password.`,
  }
}

// Thrown from the beforeDelete hook: the soft delete has already happened,
// and throwing prevents Better Auth from hard-deleting the row. FOUND turns
// the callback response into a browser redirect to the goodbye page.
export function accountDeletedRedirect(baseURL: string) {
  const location = new URL(ACCOUNT_DELETED_PATH, baseURL).toString()
  return new APIError('FOUND', undefined, new Headers({ location }))
}
