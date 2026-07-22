import { page } from 'vitest/browser'
import VerifyEmailBanner from './VerifyEmailBanner.svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'

const { sendVerificationEmailMock } = vi.hoisted(() => ({
  sendVerificationEmailMock: vi.fn().mockResolvedValue({ data: { status: true }, error: null }),
}))

vi.mock('$lib/auth-client', () => ({
  authClient: {
    sendVerificationEmail: sendVerificationEmailMock,
  },
  signOut: vi.fn(),
}))

describe('VerifyEmailBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('tells the user to confirm the address we emailed', async () => {
    render(VerifyEmailBanner, { email: 'jeff@example.com' })
    const banner = page.getByRole('status')
    await expect.element(banner).toHaveTextContent(/confirm your email/i)
    await expect.element(banner).toHaveTextContent('jeff@example.com')
  })

  it('resends the verification email for the given address', async () => {
    render(VerifyEmailBanner, { email: 'jeff@example.com' })
    await page.getByRole('button', { name: 'Resend email' }).click()

    expect(sendVerificationEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'jeff@example.com',
        callbackURL: '/app/verify-email',
      }),
    )
  })

  it('confirms the resend and prevents hammering the button', async () => {
    render(VerifyEmailBanner, { email: 'jeff@example.com' })
    await page.getByRole('button', { name: 'Resend email' }).click()

    const sentButton = page.getByRole('button', { name: 'Sent' })
    await expect.element(sentButton).toBeDisabled()
    expect(sendVerificationEmailMock).toHaveBeenCalledTimes(1)
  })
})
