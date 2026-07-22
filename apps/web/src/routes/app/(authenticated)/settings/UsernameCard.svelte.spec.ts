import { page } from 'vitest/browser'
import UsernameCard from './UsernameCard.svelte'
import {
  USERNAME_UNAVAILABLE_MESSAGE,
  USERNAME_UPDATED_MESSAGE,
  UNEXPECTED_ERROR_MESSAGE,
} from '$lib/validation'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'

const { updateUserMock, invalidateAllMock } = vi.hoisted(() => ({
  updateUserMock: vi.fn().mockResolvedValue({ data: { status: true }, error: null }),
  invalidateAllMock: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('$app/navigation', () => ({ invalidateAll: invalidateAllMock }))
vi.mock('$lib/auth-client', () => ({ authClient: { updateUser: updateUserMock } }))

describe('UsernameCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('prefills the current username', async () => {
    render(UsernameCard, { props: { name: 'jeff' } })
    await expect.element(page.getByLabelText('Username')).toHaveValue('jeff')
  })

  it('updates the username and refreshes session data', async () => {
    render(UsernameCard, { props: { name: 'jeff' } })
    await page.getByLabelText('Username').fill('jeff_v2')
    await page.getByRole('button', { name: 'Change username' }).click()

    expect(updateUserMock).toHaveBeenCalledWith({ name: 'jeff_v2' })
    await expect.element(page.getByText(USERNAME_UPDATED_MESSAGE)).toBeInTheDocument()
    expect(invalidateAllMock).toHaveBeenCalled()
  })

  it('surfaces an unavailable username without confirming an account exists', async () => {
    updateUserMock.mockResolvedValueOnce({
      data: null,
      error: { code: 'USERNAME_UNAVAILABLE', message: 'These details cannot be used', status: 422 },
    })
    render(UsernameCard, { props: { name: 'jeff' } })
    await page.getByLabelText('Username').fill('taken_name')
    await page.getByRole('button', { name: 'Change username' }).click()

    await expect.element(page.getByText(USERNAME_UNAVAILABLE_MESSAGE)).toBeInTheDocument()
  })

  it('validates locally before calling the API', async () => {
    render(UsernameCard, { props: { name: 'jeff' } })
    await page.getByLabelText('Username').fill('not valid!')
    await page.getByRole('button', { name: 'Change username' }).click()

    expect(updateUserMock).not.toHaveBeenCalled()
  })

  it('maps unknown failures to the generic message', async () => {
    updateUserMock.mockResolvedValueOnce({
      data: null,
      error: { code: 'FAILED_TO_UPDATE_USER', message: 'boom', status: 500 },
    })
    render(UsernameCard, { props: { name: 'jeff' } })
    await page.getByLabelText('Username').fill('jeff_v3')
    await page.getByRole('button', { name: 'Change username' }).click()

    await expect.element(page.getByText(UNEXPECTED_ERROR_MESSAGE)).toBeInTheDocument()
  })
})
