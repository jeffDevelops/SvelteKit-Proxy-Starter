import { page } from 'vitest/browser'
import AdminPage from './+page.svelte'
import {
  ADMIN_CANNOT_BAN_SELF_MESSAGE,
  USER_BANNED_MESSAGE,
  USER_UNBANNED_MESSAGE,
} from '$lib/validation'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'

const { listUsersMock, banUserMock, unbanUserMock } = vi.hoisted(() => ({
  listUsersMock: vi.fn().mockResolvedValue({ data: { users: [] }, error: null }),
  banUserMock: vi.fn().mockResolvedValue({ data: { user: {} }, error: null }),
  unbanUserMock: vi.fn().mockResolvedValue({ data: { user: {} }, error: null }),
}))

vi.mock('$lib/auth-client', () => ({
  authClient: {
    admin: {
      listUsers: listUsersMock,
      banUser: banUserMock,
      unbanUser: unbanUserMock,
    },
  },
}))

const member = {
  id: 'u-member',
  name: 'e2emember',
  email: 'member@example.com',
  role: 'user',
  banned: false,
  createdAt: '2026-07-01T12:00:00.000Z',
}
const bannedMember = {
  ...member,
  id: 'u-banned',
  name: 'e2ebanned',
  email: 'banned@example.com',
  banned: true,
  banReason: 'scraping',
}

function renderAdmin() {
  return render(AdminPage, {
    data: {
      user: { id: 'u-admin', name: 'jeff', role: 'admin' },
      session: { id: 's-1', token: 't' },
    },
  })
}

describe('Admin Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listUsersMock.mockResolvedValue({ data: { users: [member, bannedMember] }, error: null })
  })

  it('lists users with their ban state on load', async () => {
    renderAdmin()

    await expect.element(page.getByText('e2emember')).toBeInTheDocument()
    await expect.element(page.getByText('member@example.com')).toBeInTheDocument()
    await expect.element(page.getByText('Banned: scraping')).toBeInTheDocument()
  })

  it('searches by email when the term contains an @', async () => {
    renderAdmin()
    await page.getByLabelText('Search by username or email').fill('kalman@example.com')
    await page.getByRole('button', { name: 'Search' }).click()

    expect(listUsersMock).toHaveBeenLastCalledWith({
      query: expect.objectContaining({
        searchValue: 'kalman@example.com',
        searchField: 'email',
        searchOperator: 'contains',
      }),
    })
  })

  it('searches by username otherwise', async () => {
    renderAdmin()
    await page.getByLabelText('Search by username or email').fill('kalman')
    await page.getByRole('button', { name: 'Search' }).click()

    expect(listUsersMock).toHaveBeenLastCalledWith({
      query: expect.objectContaining({ searchValue: 'kalman', searchField: 'name' }),
    })
  })

  it('bans with a reason and duration through the inline form', async () => {
    renderAdmin()
    await page.getByRole('button', { name: 'Ban e2emember' }).click()
    await page.getByLabelText('Ban reason').fill('content exfiltration')
    await page.getByLabelText('Duration in days (leave empty for permanent)').fill('30')
    await page.getByRole('button', { name: 'Confirm ban' }).click()

    expect(banUserMock).toHaveBeenCalledWith({
      userId: 'u-member',
      banReason: 'content exfiltration',
      banExpiresIn: 30 * 86400,
    })
    await expect.element(page.getByText(USER_BANNED_MESSAGE)).toBeInTheDocument()
    expect(listUsersMock.mock.calls.length).toBeGreaterThan(1)
  })

  it('bans permanently when the duration is left empty', async () => {
    renderAdmin()
    await page.getByRole('button', { name: 'Ban e2emember' }).click()
    await page.getByLabelText('Ban reason').fill('spam')
    await page.getByRole('button', { name: 'Confirm ban' }).click()

    expect(banUserMock).toHaveBeenCalledWith({ userId: 'u-member', banReason: 'spam' })
  })

  it('unbans a banned user', async () => {
    renderAdmin()
    await page.getByRole('button', { name: 'Unban e2ebanned' }).click()

    expect(unbanUserMock).toHaveBeenCalledWith({ userId: 'u-banned' })
    await expect.element(page.getByText(USER_UNBANNED_MESSAGE)).toBeInTheDocument()
  })

  it('surfaces the self-ban guard', async () => {
    banUserMock.mockResolvedValueOnce({
      data: null,
      error: { code: 'YOU_CANNOT_BAN_YOURSELF', message: 'You cannot ban yourself', status: 400 },
    })
    renderAdmin()
    await page.getByRole('button', { name: 'Ban e2emember' }).click()
    await page.getByRole('button', { name: 'Confirm ban' }).click()

    await expect.element(page.getByText(ADMIN_CANNOT_BAN_SELF_MESSAGE)).toBeInTheDocument()
  })
})
