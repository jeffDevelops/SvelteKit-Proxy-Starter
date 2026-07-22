import { page } from 'vitest/browser'
import ForgotPasswordPage from './+page.svelte'
import { RESET_LINK_SENT_MESSAGE, UNEXPECTED_ERROR_MESSAGE } from '$lib/validation'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'

const { requestPasswordResetMock } = vi.hoisted(() => ({
  requestPasswordResetMock: vi.fn().mockResolvedValue({ data: { status: true }, error: null }),
}))

vi.mock('$lib/auth-client', () => ({
  authClient: {
    requestPasswordReset: requestPasswordResetMock,
  },
  signOut: vi.fn(),
}))

async function submit(email = 'jeff@example.com') {
  await page.getByLabelText('Email').fill(email)
  await page.getByRole('button', { name: 'Send reset link' }).click()
}

describe('Forgot Password Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('tells the user where they are', async () => {
    render(ForgotPasswordPage)
    await expect.element(page.getByRole('heading', { name: 'Forgot Password' })).toBeInTheDocument()
  })

  it('renders an email input and a link back to sign in', async () => {
    render(ForgotPasswordPage)
    const emailInput = page.getByLabelText('Email')
    await expect.element(emailInput).toHaveAttribute('type', 'email')
    await expect.element(page.getByRole('link', { name: 'Sign In' })).toBeInTheDocument()
  })

  it('validates the email only after blur', async () => {
    render(ForgotPasswordPage)
    const emailInput = page.getByLabelText('Email')
    await emailInput.fill('not-an-email')
    await expect.element(page.getByText('Enter a valid email address')).not.toBeInTheDocument()
    emailInput.element().blur()
    await expect.element(page.getByText('Enter a valid email address')).toBeInTheDocument()
  })

  it('requests a reset link with a redirect to the reset page', async () => {
    render(ForgotPasswordPage)
    await submit()
    expect(requestPasswordResetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'jeff@example.com',
        redirectTo: '/app/reset-password',
      }),
    )
  })

  it('shows the enumeration-safe sent message on success', async () => {
    render(ForgotPasswordPage)
    await submit()
    await expect.element(page.getByRole('status')).toHaveTextContent(RESET_LINK_SENT_MESSAGE)
  })

  it('shows the identical sent message even if the API reports an unknown email', async () => {
    // Defense in depth: the API already answers identically for unknown
    // emails, but if it ever leaked an error the page must not.
    requestPasswordResetMock.mockResolvedValueOnce({
      data: null,
      error: { code: 'USER_NOT_FOUND', message: 'user not found', status: 404 },
    })
    render(ForgotPasswordPage)
    await submit('unknown@example.com')
    await expect.element(page.getByRole('status')).toHaveTextContent(RESET_LINK_SENT_MESSAGE)
    await expect.element(page.getByText('user not found')).not.toBeInTheDocument()
  })

  it('shows the generic error only for infrastructure failures', async () => {
    requestPasswordResetMock.mockResolvedValueOnce({
      data: null,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'boom', status: 500 },
    })
    render(ForgotPasswordPage)
    await submit()
    await expect.element(page.getByRole('alert')).toHaveTextContent(UNEXPECTED_ERROR_MESSAGE)
  })
})
