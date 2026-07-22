import { page } from 'vitest/browser'
import TwoFactorCard from './TwoFactorCard.svelte'
import {
  CURRENT_PASSWORD_INCORRECT_MESSAGE,
  TWO_FACTOR_CODE_INVALID_MESSAGE,
  TWO_FACTOR_DISABLED_MESSAGE,
  TWO_FACTOR_ENABLED_MESSAGE,
} from '$lib/validation'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'

const { twoFactorEnableMock, twoFactorDisableMock, twoFactorVerifyTotpMock, invalidateAllMock } =
  vi.hoisted(() => ({
    twoFactorEnableMock: vi.fn().mockResolvedValue({
      data: {
        totpURI: 'otpauth://totp/auth-starter:jeff?secret=JBSWY3DPEHPK3PXP&issuer=auth-starter',
        backupCodes: ['aaaaa-bbbbb', 'ccccc-ddddd'],
      },
      error: null,
    }),
    twoFactorDisableMock: vi.fn().mockResolvedValue({ data: { status: true }, error: null }),
    twoFactorVerifyTotpMock: vi.fn().mockResolvedValue({ data: { status: true }, error: null }),
    invalidateAllMock: vi.fn().mockResolvedValue(undefined),
  }))

vi.mock('$app/navigation', () => ({ invalidateAll: invalidateAllMock }))
vi.mock('$lib/auth-client', () => ({
  authClient: {
    twoFactor: {
      enable: twoFactorEnableMock,
      disable: twoFactorDisableMock,
      verifyTotp: twoFactorVerifyTotpMock,
    },
  },
}))

async function startEnrollment(password = 'password123') {
  await page.getByLabelText('Account password').fill(password)
  await page.getByRole('button', { name: 'Enable two-factor' }).click()
}

describe('TwoFactorCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts enrollment with the account password and shows the QR + backup codes', async () => {
    render(TwoFactorCard, { props: { enabled: false } })
    await startEnrollment()

    expect(twoFactorEnableMock).toHaveBeenCalledWith({ password: 'password123' })
    await expect.element(page.getByRole('img', { name: 'Two-factor QR code' })).toBeInTheDocument()
    await expect.element(page.getByText('aaaaa-bbbbb')).toBeInTheDocument()
    await expect.element(page.getByText('ccccc-ddddd')).toBeInTheDocument()
  })

  it('requires a password before calling the API', async () => {
    render(TwoFactorCard, { props: { enabled: false } })
    await page.getByRole('button', { name: 'Enable two-factor' }).click()

    expect(twoFactorEnableMock).not.toHaveBeenCalled()
  })

  it('shows a manual-entry key for setups that can’t scan the QR', async () => {
    render(TwoFactorCard, { props: { enabled: false } })
    await startEnrollment()

    await expect.element(page.getByText('JBSWY3DPEHPK3PXP')).toBeInTheDocument()
  })

  it('confirms enrollment with a TOTP code and refreshes session data', async () => {
    render(TwoFactorCard, { props: { enabled: false } })
    await startEnrollment()
    await page.getByLabelText('Verification code').fill('123456')
    await page.getByRole('button', { name: 'Confirm code' }).click()

    expect(twoFactorVerifyTotpMock).toHaveBeenCalledWith({ code: '123456' })
    await expect.element(page.getByText(TWO_FACTOR_ENABLED_MESSAGE)).toBeInTheDocument()
    expect(invalidateAllMock).toHaveBeenCalled()
  })

  it('tells the user when the password is wrong', async () => {
    twoFactorEnableMock.mockResolvedValueOnce({
      data: null,
      error: { code: 'INVALID_PASSWORD', message: 'Invalid password', status: 400 },
    })
    render(TwoFactorCard, { props: { enabled: false } })
    await startEnrollment('wrong-password')

    await expect.element(page.getByText(CURRENT_PASSWORD_INCORRECT_MESSAGE)).toBeInTheDocument()
  })

  it('tells the user when the confirmation code is wrong', async () => {
    twoFactorVerifyTotpMock.mockResolvedValueOnce({
      data: null,
      error: { code: 'INVALID_CODE', message: 'Invalid code', status: 401 },
    })
    render(TwoFactorCard, { props: { enabled: false } })
    await startEnrollment()
    await page.getByLabelText('Verification code').fill('000000')
    await page.getByRole('button', { name: 'Confirm code' }).click()

    await expect.element(page.getByText(TWO_FACTOR_CODE_INVALID_MESSAGE)).toBeInTheDocument()
  })

  it('disables two-factor with the account password', async () => {
    render(TwoFactorCard, { props: { enabled: true } })
    await page.getByLabelText('Account password').fill('password123')
    await page.getByRole('button', { name: 'Disable two-factor' }).click()

    expect(twoFactorDisableMock).toHaveBeenCalledWith({ password: 'password123' })
    await expect.element(page.getByText(TWO_FACTOR_DISABLED_MESSAGE)).toBeInTheDocument()
    expect(invalidateAllMock).toHaveBeenCalled()
  })
})
