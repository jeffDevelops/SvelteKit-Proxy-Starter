import { page } from 'vitest/browser'
import DeleteAccountCard from './DeleteAccountCard.svelte'
import {
  CURRENT_PASSWORD_INCORRECT_MESSAGE,
  DELETE_ACCOUNT_EMAIL_SENT_MESSAGE,
} from '$lib/validation'
import { ACCOUNT_DELETED_PATH } from '@auth-starter/validation'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'

const { deleteUserMock } = vi.hoisted(() => ({
  deleteUserMock: vi.fn().mockResolvedValue({ data: { success: true }, error: null }),
}))

vi.mock('$lib/auth-client', () => ({ authClient: { deleteUser: deleteUserMock } }))

describe('DeleteAccountCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends the confirmation email after re-entering the password', async () => {
    render(DeleteAccountCard)
    await page.getByLabelText('Confirm your password').fill('password123')
    await page.getByRole('button', { name: 'Delete account' }).click()

    expect(deleteUserMock).toHaveBeenCalledWith({
      password: 'password123',
      callbackURL: ACCOUNT_DELETED_PATH,
    })
    await expect.element(page.getByText(DELETE_ACCOUNT_EMAIL_SENT_MESSAGE)).toBeInTheDocument()
  })

  it('requires a password before calling the API', async () => {
    render(DeleteAccountCard)
    await page.getByRole('button', { name: 'Delete account' }).click()

    expect(deleteUserMock).not.toHaveBeenCalled()
  })

  it('tells the user when the password is wrong', async () => {
    deleteUserMock.mockResolvedValueOnce({
      data: null,
      error: { code: 'INVALID_PASSWORD', message: 'Invalid password', status: 400 },
    })
    render(DeleteAccountCard)
    await page.getByLabelText('Confirm your password').fill('wrong-password')
    await page.getByRole('button', { name: 'Delete account' }).click()

    await expect.element(page.getByText(CURRENT_PASSWORD_INCORRECT_MESSAGE)).toBeInTheDocument()
  })
})
