import { page } from 'vitest/browser'
import ResetPasswordPage from './+page.svelte'
import {
  PASSWORD_RESET_SUCCESS_MESSAGE,
  RESET_LINK_INVALID_MESSAGE,
  UNEXPECTED_ERROR_MESSAGE,
} from '$lib/validation'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'

const { resetPasswordMock, appState } = vi.hoisted(() => ({
  resetPasswordMock: vi.fn().mockResolvedValue({ data: { status: true }, error: null }),
  appState: { page: { url: new URL('http://localhost/app/reset-password?token=tok123') } },
}))

vi.mock('$app/state', () => appState)

vi.mock('$lib/auth-client', () => ({
  authClient: {
    resetPassword: resetPasswordMock,
  },
  signOut: vi.fn(),
}))

describe('Reset Password Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    appState.page.url = new URL('http://localhost/app/reset-password?token=tok123')
  })

  it('tells the user where they are', async () => {
    render(ResetPasswordPage)
    await expect.element(page.getByRole('heading', { name: 'Reset Password' })).toBeInTheDocument()
  })

  it('renders a new-password input that enforces the password policy', async () => {
    render(ResetPasswordPage)
    const passwordInput = page.getByLabelText('New password')
    await expect.element(passwordInput).toHaveAttribute('type', 'password')
    await passwordInput.fill('short')
    passwordInput.element().blur()
    await expect
      .element(page.getByText('Password must be at least 8 characters'))
      .toBeInTheDocument()
  })

  it('resets the password using the token from the link', async () => {
    render(ResetPasswordPage)
    await page.getByLabelText('New password').fill('new-password-123')
    await page.getByRole('button', { name: 'Reset password' }).click()

    expect(resetPasswordMock).toHaveBeenCalledWith(
      expect.objectContaining({ newPassword: 'new-password-123', token: 'tok123' }),
    )
  })

  it('confirms success and points the user at sign in', async () => {
    render(ResetPasswordPage)
    await page.getByLabelText('New password').fill('new-password-123')
    await page.getByRole('button', { name: 'Reset password' }).click()

    await expect.element(page.getByRole('status')).toHaveTextContent(PASSWORD_RESET_SUCCESS_MESSAGE)
    await expect.element(page.getByRole('link', { name: 'Sign In' })).toBeInTheDocument()
  })

  it('shows the invalid-link state instead of the form when the link has expired', async () => {
    appState.page.url = new URL('http://localhost/app/reset-password?error=INVALID_TOKEN')
    render(ResetPasswordPage)

    await expect.element(page.getByText(RESET_LINK_INVALID_MESSAGE)).toBeInTheDocument()
    await expect.element(page.getByRole('link', { name: 'Request a new link' })).toBeInTheDocument()
    expect(page.getByLabelText('New password').elements()).toHaveLength(0)
  })

  it('shows the invalid-link state when there is no token at all', async () => {
    appState.page.url = new URL('http://localhost/app/reset-password')
    render(ResetPasswordPage)

    await expect.element(page.getByText(RESET_LINK_INVALID_MESSAGE)).toBeInTheDocument()
    expect(page.getByLabelText('New password').elements()).toHaveLength(0)
  })

  it('maps a rejected token to the invalid-link message', async () => {
    resetPasswordMock.mockResolvedValueOnce({
      data: null,
      error: { code: 'INVALID_TOKEN', message: 'invalid token', status: 400 },
    })
    render(ResetPasswordPage)
    await page.getByLabelText('New password').fill('new-password-123')
    await page.getByRole('button', { name: 'Reset password' }).click()

    await expect.element(page.getByRole('alert')).toHaveTextContent(RESET_LINK_INVALID_MESSAGE)
  })

  it('shows the generic message for unrecognized failures without echoing server text', async () => {
    resetPasswordMock.mockResolvedValueOnce({
      data: null,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'verification row missing', status: 500 },
    })
    render(ResetPasswordPage)
    await page.getByLabelText('New password').fill('new-password-123')
    await page.getByRole('button', { name: 'Reset password' }).click()

    await expect.element(page.getByRole('alert')).toHaveTextContent(UNEXPECTED_ERROR_MESSAGE)
    await expect.element(page.getByText('verification row missing')).not.toBeInTheDocument()
  })
})
