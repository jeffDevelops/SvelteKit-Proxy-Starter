import type { EmailMessage } from '@auth-starter/email'
import { EMAIL_CHANGE_APPROVED_PATH, EMAIL_CHANGE_COMPLETED_PATH } from '@auth-starter/validation'

interface Recipient {
  name: string
  email: string
}

// Better Auth calls sendVerificationEmail for both sign-up verification and
// the final leg of a change-email flow; the only distinguishing signal is the
// callbackURL we planted in the change request. The change leg also needs its
// callback rewritten: Better Auth reuses the first leg's callbackURL when it
// mints the second token, and that leg must land on the completed state.
export function verificationEmail(user: Recipient, url: string): EmailMessage {
  const link = new URL(url)
  const callback = link.searchParams.get('callbackURL')

  if (callback !== EMAIL_CHANGE_APPROVED_PATH && callback !== EMAIL_CHANGE_COMPLETED_PATH) {
    return {
      to: user.email,
      subject: 'Confirm your auth-starter email address',
      text:
        `Hi ${user.name},\n\n` +
        `Confirm this email address for your auth-starter account:\n\n${url}\n\n` +
        `If you didn't create a auth-starter account, you can safely ignore ` +
        `this email.`,
    }
  }

  if (callback === EMAIL_CHANGE_APPROVED_PATH) {
    link.searchParams.set('callbackURL', EMAIL_CHANGE_COMPLETED_PATH)
  }

  return {
    to: user.email,
    subject: 'Confirm your new auth-starter email address',
    text:
      `Hi ${user.name},\n\n` +
      `To finish changing your auth-starter account email to this address, ` +
      `confirm it here:\n\n${link.toString()}\n\n` +
      `If you didn't request this change, you can safely ignore this email — ` +
      `your account email won't change.`,
  }
}
