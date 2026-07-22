import { page } from 'vitest/browser'
import PasskeysCard from './PasskeysCard.svelte'
import {
  PASSKEY_ADDED_MESSAGE,
  PASSKEY_ALREADY_REGISTERED_MESSAGE,
  PASSKEY_REMOVED_MESSAGE,
  UNEXPECTED_ERROR_MESSAGE,
} from '$lib/validation'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'

const { addPasskeyMock, listPasskeysMock, deletePasskeyMock } = vi.hoisted(() => ({
  addPasskeyMock: vi.fn().mockResolvedValue({ data: {}, error: null }),
  listPasskeysMock: vi.fn().mockResolvedValue({ data: [], error: null }),
  deletePasskeyMock: vi.fn().mockResolvedValue({ data: { status: true }, error: null }),
}))

vi.mock('$lib/auth-client', () => ({
  authClient: {
    passkey: {
      addPasskey: addPasskeyMock,
      listUserPasskeys: listPasskeysMock,
      deletePasskey: deletePasskeyMock,
    },
  },
}))

const storedPasskey = (overrides: Record<string, unknown> = {}) => ({
  id: 'pk-1',
  name: 'Work laptop',
  deviceType: 'platform',
  backedUp: true,
  createdAt: '2026-07-01T12:00:00.000Z',
  ...overrides,
})

describe('PasskeysCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listPasskeysMock.mockResolvedValue({ data: [], error: null })
  })

  it('lists registered passkeys', async () => {
    listPasskeysMock.mockResolvedValue({ data: [storedPasskey()], error: null })
    render(PasskeysCard)

    await expect.element(page.getByText('Work laptop')).toBeInTheDocument()
  })

  it('labels an unnamed passkey without breaking the row', async () => {
    listPasskeysMock.mockResolvedValue({ data: [storedPasskey({ name: null })], error: null })
    render(PasskeysCard)

    await expect.element(page.getByRole('button', { name: 'Remove Passkey' })).toBeInTheDocument()
  })

  it('shows an empty state when there are none', async () => {
    render(PasskeysCard)
    await expect.element(page.getByText('No passkeys yet.')).toBeInTheDocument()
  })

  it('registers a passkey with the chosen name and refreshes the list', async () => {
    render(PasskeysCard)
    await page.getByLabelText('Passkey name').fill('Work laptop')
    await page.getByRole('button', { name: 'Add passkey' }).click()

    expect(addPasskeyMock).toHaveBeenCalledWith({ name: 'Work laptop' })
    await expect.element(page.getByText(PASSKEY_ADDED_MESSAGE)).toBeInTheDocument()
    // Once on mount, again after registering
    expect(listPasskeysMock).toHaveBeenCalledTimes(2)
    await expect.element(page.getByLabelText('Passkey name')).toHaveValue('')
  })

  it('registers without a name when the field is left empty', async () => {
    render(PasskeysCard)
    await page.getByRole('button', { name: 'Add passkey' }).click()

    expect(addPasskeyMock).toHaveBeenCalledWith({})
  })

  it('stays silent when the user cancels the browser prompt', async () => {
    addPasskeyMock.mockResolvedValueOnce({
      data: null,
      error: { code: 'ERROR_CEREMONY_ABORTED', message: 'Registration cancelled', status: 400 },
    })
    render(PasskeysCard)
    await page.getByRole('button', { name: 'Add passkey' }).click()

    expect(page.getByText(UNEXPECTED_ERROR_MESSAGE).elements()).toHaveLength(0)
    expect(page.getByText(PASSKEY_ADDED_MESSAGE).elements()).toHaveLength(0)
  })

  it('explains when this device already has a passkey for the account', async () => {
    addPasskeyMock.mockResolvedValueOnce({
      data: null,
      error: {
        code: 'ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED',
        message: 'previously registered',
        status: 400,
      },
    })
    render(PasskeysCard)
    await page.getByRole('button', { name: 'Add passkey' }).click()

    await expect.element(page.getByText(PASSKEY_ALREADY_REGISTERED_MESSAGE)).toBeInTheDocument()
  })

  it('removes a passkey and refreshes the list', async () => {
    listPasskeysMock.mockResolvedValue({ data: [storedPasskey()], error: null })
    render(PasskeysCard)
    await page.getByRole('button', { name: 'Remove Work laptop' }).click()

    expect(deletePasskeyMock).toHaveBeenCalledWith({ id: 'pk-1' })
    await expect.element(page.getByText(PASSKEY_REMOVED_MESSAGE)).toBeInTheDocument()
  })
})
