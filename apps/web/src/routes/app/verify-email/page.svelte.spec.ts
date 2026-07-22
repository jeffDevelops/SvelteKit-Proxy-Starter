import { page } from 'vitest/browser'
import VerifyEmailPage from './+page.svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'

const { appState } = vi.hoisted(() => ({
  appState: { page: { url: new URL('http://localhost/app/verify-email') } },
}))

vi.mock('$app/state', () => appState)

describe('Verify Email Page', () => {
  beforeEach(() => {
    appState.page.url = new URL('http://localhost/app/verify-email')
  })

  it('confirms the email and links into the app on success', async () => {
    render(VerifyEmailPage)
    await expect.element(page.getByRole('status')).toHaveTextContent(/email confirmed/i)
    const link = page.getByRole('link', { name: 'Continue to auth-starter' })
    await expect.element(link).toHaveAttribute('href', '/app')
  })

  it('explains when the link is invalid and points at sign in for a resend', async () => {
    appState.page.url = new URL('http://localhost/app/verify-email?error=INVALID_TOKEN')
    render(VerifyEmailPage)

    await expect.element(page.getByRole('alert')).toHaveTextContent(/invalid or has expired/i)
    await expect.element(page.getByRole('link', { name: 'Sign In' })).toBeInTheDocument()
    expect(page.getByRole('link', { name: 'Continue to auth-starter' }).elements()).toHaveLength(0)
  })

  it('treats an expired token the same as an invalid one', async () => {
    appState.page.url = new URL('http://localhost/app/verify-email?error=TOKEN_EXPIRED')
    render(VerifyEmailPage)
    await expect.element(page.getByRole('alert')).toHaveTextContent(/invalid or has expired/i)
  })
})
