import { page } from 'vitest/browser'
import DevicesCard from './DevicesCard.svelte'
import { OTHER_SESSIONS_REVOKED_MESSAGE, SESSION_REVOKED_MESSAGE } from '$lib/validation'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'

const { listSessionsMock, revokeSessionMock, revokeOtherSessionsMock } = vi.hoisted(() => ({
  listSessionsMock: vi.fn().mockResolvedValue({ data: [], error: null }),
  revokeSessionMock: vi.fn().mockResolvedValue({ data: { status: true }, error: null }),
  revokeOtherSessionsMock: vi.fn().mockResolvedValue({ data: { status: true }, error: null }),
}))

vi.mock('$lib/auth-client', () => ({
  authClient: {
    listSessions: listSessionsMock,
    revokeSession: revokeSessionMock,
    revokeOtherSessions: revokeOtherSessionsMock,
  },
}))

const chromeWindows =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
const firefoxLinux = 'Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0'

const currentSession = {
  id: 's-current',
  token: 'current-token',
  userAgent: chromeWindows,
  ipAddress: '203.0.113.9',
  createdAt: '2026-07-01T12:00:00.000Z',
  updatedAt: '2026-07-19T09:00:00.000Z',
}
const otherSession = {
  id: 's-other',
  token: 'other-token',
  userAgent: firefoxLinux,
  ipAddress: '203.0.113.10',
  createdAt: '2026-07-02T12:00:00.000Z',
  updatedAt: '2026-07-18T09:00:00.000Z',
}

function renderCard() {
  return render(DevicesCard, { props: { currentToken: 'current-token' } })
}

describe('DevicesCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listSessionsMock.mockResolvedValue({ data: [currentSession, otherSession], error: null })
  })

  it('lists devices and marks the current one', async () => {
    renderCard()

    await expect.element(page.getByText('Chrome on Windows')).toBeInTheDocument()
    await expect.element(page.getByText('Firefox on Linux')).toBeInTheDocument()
    await expect.element(page.getByText('This device', { exact: true })).toBeInTheDocument()
  })

  it('offers no revoke button for the current device', async () => {
    renderCard()

    await expect
      .element(page.getByRole('button', { name: 'Sign out Firefox on Linux' }))
      .toBeInTheDocument()
    expect(
      page.getByRole('button', { name: 'Sign out Chrome on Windows' }).elements(),
    ).toHaveLength(0)
  })

  it('revokes another device and refreshes the list', async () => {
    renderCard()
    await page.getByRole('button', { name: 'Sign out Firefox on Linux' }).click()

    expect(revokeSessionMock).toHaveBeenCalledWith({ token: 'other-token' })
    await expect.element(page.getByText(SESSION_REVOKED_MESSAGE)).toBeInTheDocument()
    expect(listSessionsMock.mock.calls.length).toBeGreaterThan(1)
  })

  it('signs out all other devices at once', async () => {
    renderCard()
    await page.getByRole('button', { name: 'Sign out other devices' }).click()

    expect(revokeOtherSessionsMock).toHaveBeenCalled()
    await expect.element(page.getByText(OTHER_SESSIONS_REVOKED_MESSAGE)).toBeInTheDocument()
  })
})
