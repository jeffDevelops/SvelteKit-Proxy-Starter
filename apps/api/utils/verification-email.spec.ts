import { describe, expect, it } from 'bun:test'
import { EMAIL_CHANGE_APPROVED_PATH, EMAIL_CHANGE_COMPLETED_PATH } from '@auth-starter/validation'
import { verificationEmail } from './verification-email'

const user = { name: 'e2ejeff', email: 'jeff@example.com' }

const verifyUrl = (callbackURL: string) =>
  `http://localhost:3000/api/auth/verify-email?token=tok123&callbackURL=${encodeURIComponent(callbackURL)}`

describe('verificationEmail', () => {
  it('sends the sign-up copy with the link untouched for ordinary verification', () => {
    const url = verifyUrl('/app/verify-email')
    const message = verificationEmail(user, url)

    expect(message.to).toBe(user.email)
    expect(message.subject).toBe('Confirm your auth-starter email address')
    expect(message.text).toContain(url)
  })

  it('uses change-of-email copy when the link completes an email change', () => {
    const message = verificationEmail(user, verifyUrl(EMAIL_CHANGE_COMPLETED_PATH))

    expect(message.subject).toBe('Confirm your new auth-starter email address')
    expect(message.text).toMatch(/changing .* email/i)
  })

  it('rewrites the second-leg callback so it lands on the completed state', () => {
    // Better Auth reuses the first leg's callbackURL when it mints the
    // second token, so the approved landing must be swapped for completed.
    const message = verificationEmail(user, verifyUrl(EMAIL_CHANGE_APPROVED_PATH))

    expect(message.subject).toBe('Confirm your new auth-starter email address')
    expect(message.text).toContain(encodeURIComponent(EMAIL_CHANGE_COMPLETED_PATH))
    expect(message.text).not.toContain(encodeURIComponent(EMAIL_CHANGE_APPROVED_PATH))
    expect(message.text).toContain('token=tok123')
  })
})
