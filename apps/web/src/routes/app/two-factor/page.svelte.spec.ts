import { page } from 'vitest/browser'
import TwoFactorPage from './+page.svelte'
import { TWO_FACTOR_CODE_INVALID_MESSAGE } from '$lib/validation'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'

const { verifyTotpMock, verifyBackupCodeMock, gotoMock } = vi.hoisted(() => ({
  verifyTotpMock: vi.fn().mockResolvedValue({ data: { token: 't' }, error: null }),
  verifyBackupCodeMock: vi.fn().mockResolvedValue({ data: { token: 't' }, error: null }),
  gotoMock: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('$app/navigation', () => ({
  goto: gotoMock,
}))

vi.mock('$lib/auth-client', () => ({
  authClient: {
    twoFactor: {
      verifyTotp: verifyTotpMock,
      verifyBackupCode: verifyBackupCodeMock,
    },
  },
  signOut: vi.fn(),
}))

describe('Two-Factor Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('asks for the authenticator code', async () => {
    render(TwoFactorPage)
    await expect
      .element(page.getByRole('heading', { name: 'Two-Factor Verification' }))
      .toBeInTheDocument()
    await expect.element(page.getByLabelText('Verification code')).toBeInTheDocument()
  })

  it('verifies the TOTP code and navigates to the app', async () => {
    render(TwoFactorPage)
    await page.getByLabelText('Verification code').fill('123456')
    await page.getByRole('button', { name: 'Verify' }).click()

    expect(verifyTotpMock).toHaveBeenCalledWith({ code: '123456' })
    await vi.waitFor(() => {
      expect(gotoMock).toHaveBeenCalledWith('/app', { invalidateAll: true })
    })
  })

  it('does not call the API with an empty code', async () => {
    render(TwoFactorPage)
    await page.getByRole('button', { name: 'Verify' }).click()

    expect(verifyTotpMock).not.toHaveBeenCalled()
  })

  it('shows the shared invalid-code message without echoing server text', async () => {
    verifyTotpMock.mockResolvedValueOnce({
      data: null,
      error: { code: 'INVALID_CODE', message: 'totp mismatch for user', status: 401 },
    })
    render(TwoFactorPage)
    await page.getByLabelText('Verification code').fill('000000')
    await page.getByRole('button', { name: 'Verify' }).click()

    await expect.element(page.getByRole('alert')).toHaveTextContent(TWO_FACTOR_CODE_INVALID_MESSAGE)
    await expect.element(page.getByText('totp mismatch for user')).not.toBeInTheDocument()
    expect(gotoMock).not.toHaveBeenCalled()
  })

  it('verifies a backup code in backup mode', async () => {
    render(TwoFactorPage)
    await page.getByRole('button', { name: 'Use a backup code instead' }).click()
    await page.getByLabelText('Backup code').fill('aaaaa-bbbbb')
    await page.getByRole('button', { name: 'Verify' }).click()

    expect(verifyBackupCodeMock).toHaveBeenCalledWith({ code: 'aaaaa-bbbbb' })
    expect(verifyTotpMock).not.toHaveBeenCalled()
    await vi.waitFor(() => {
      expect(gotoMock).toHaveBeenCalledWith('/app', { invalidateAll: true })
    })
  })

  it('can switch back to the authenticator app', async () => {
    render(TwoFactorPage)
    await page.getByRole('button', { name: 'Use a backup code instead' }).click()
    await page.getByRole('button', { name: 'Use your authenticator app instead' }).click()
    await expect.element(page.getByLabelText('Verification code')).toBeInTheDocument()
  })

  it('links back to sign-in', async () => {
    render(TwoFactorPage)
    const link = page.getByRole('link', { name: 'Back to sign in' })
    await expect.element(link).toHaveAttribute('href', '/app/sign-in')
  })
})
