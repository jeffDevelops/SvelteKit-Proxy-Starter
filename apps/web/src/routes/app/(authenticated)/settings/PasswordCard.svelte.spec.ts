import { page } from 'vitest/browser'
import PasswordCard from './PasswordCard.svelte'
import {
  CURRENT_PASSWORD_INCORRECT_MESSAGE,
  PASSWORD_CHANGED_MESSAGE,
  PASSWORD_REQUIRED_MESSAGE,
} from '$lib/validation'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'

const { changePasswordMock } = vi.hoisted(() => ({
  changePasswordMock: vi.fn().mockResolvedValue({ data: {}, error: null }),
}))

vi.mock('$lib/auth-client', () => ({ authClient: { changePassword: changePasswordMock } }))

async function fillPasswords(current = 'old-password-1', next = 'new-password-1') {
  await page.getByLabelText('Current password').fill(current)
  await page.getByLabelText('New password').fill(next)
  await page.getByRole('button', { name: 'Change password' }).click()
}

describe('PasswordCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('changes the password and revokes other sessions', async () => {
    render(PasswordCard)
    await fillPasswords()

    expect(changePasswordMock).toHaveBeenCalledWith(
      expect.objectContaining({
        currentPassword: 'old-password-1',
        newPassword: 'new-password-1',
        revokeOtherSessions: true,
      }),
    )
    await expect.element(page.getByText(PASSWORD_CHANGED_MESSAGE)).toBeInTheDocument()
  })

  it('tells the user when the current password is wrong', async () => {
    changePasswordMock.mockResolvedValueOnce({
      data: null,
      error: { code: 'INVALID_PASSWORD', message: 'Invalid password', status: 400 },
    })
    render(PasswordCard)
    await fillPasswords('wrong-password')

    await expect.element(page.getByText(CURRENT_PASSWORD_INCORRECT_MESSAGE)).toBeInTheDocument()
  })

  it('enforces the password policy on the new password locally', async () => {
    render(PasswordCard)
    await fillPasswords('old-password-1', 'short')

    expect(changePasswordMock).not.toHaveBeenCalled()
    await expect
      .element(page.getByText('Password must be at least 8 characters'))
      .toBeInTheDocument()
  })

  it('clears the password fields after a successful change without flagging them as errors', async () => {
    render(PasswordCard)
    await fillPasswords()

    await expect.element(page.getByLabelText('Current password')).toHaveValue('')
    await expect.element(page.getByLabelText('New password')).toHaveValue('')
    // The cleared (empty) fields must not light up as invalid — the
    // submit marked them touched, but a successful change resets that.
    await expect
      .element(page.getByLabelText('Current password'))
      .toHaveAttribute('aria-invalid', 'false')
    await expect
      .element(page.getByLabelText('New password'))
      .toHaveAttribute('aria-invalid', 'false')
    expect(page.getByText(PASSWORD_REQUIRED_MESSAGE).elements()).toHaveLength(0)
  })
})
