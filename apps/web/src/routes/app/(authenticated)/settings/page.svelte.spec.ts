import { page } from 'vitest/browser'
import SettingsPage from './+page.svelte'
import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'

// Card behavior is tested in each card's colocated spec — this file only
// covers the page's own responsibilities: section organization and wiring
// server data into the right cards.
vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost/app/settings') } }))
vi.mock('$app/navigation', () => ({ invalidateAll: vi.fn().mockResolvedValue(undefined) }))
vi.mock('$lib/auth-client', () => ({
  authClient: {
    updateUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
    changeEmail: vi.fn().mockResolvedValue({ data: {}, error: null }),
    changePassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
    deleteUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
    listSessions: vi.fn().mockResolvedValue({ data: [], error: null }),
    revokeSession: vi.fn().mockResolvedValue({ data: {}, error: null }),
    revokeOtherSessions: vi.fn().mockResolvedValue({ data: {}, error: null }),
    passkey: {
      addPasskey: vi.fn().mockResolvedValue({ data: {}, error: null }),
      listUserPasskeys: vi.fn().mockResolvedValue({ data: [], error: null }),
      deletePasskey: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
    twoFactor: {
      enable: vi.fn().mockResolvedValue({ data: {}, error: null }),
      disable: vi.fn().mockResolvedValue({ data: {}, error: null }),
      verifyTotp: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
  },
  signOut: vi.fn(),
}))

function renderSettings() {
  return render(SettingsPage, {
    data: {
      user: {
        id: 'user-1',
        name: 'jeff',
        email: 'jeff@example.com',
        emailVerified: true,
        image: null,
        twoFactorEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      session: { id: 's-current', token: 'current-token' },
    },
  })
}

describe('Settings Page', () => {
  it('tells the user where they are', async () => {
    renderSettings()
    await expect.element(page.getByRole('heading', { name: 'Settings' })).toBeInTheDocument()
  })

  it('organizes the cards under labeled sections', async () => {
    renderSettings()
    await expect
      .element(page.getByRole('heading', { name: 'Appearance', exact: true }))
      .toBeInTheDocument()
    await expect
      .element(page.getByRole('heading', { name: 'Sign-in & security' }))
      .toBeInTheDocument()
    await expect.element(page.getByRole('heading', { name: 'Danger Zone' })).toBeInTheDocument()
  })

  it('renders every card', async () => {
    renderSettings()
    for (const title of [
      'Username',
      'Email',
      'Password',
      'Passkeys',
      'Two-factor authentication',
      'Devices',
      'Appearance',
      'Delete account',
    ]) {
      await expect.element(page.getByText(title, { exact: true }).first()).toBeInTheDocument()
    }
  })

  it('feeds server data into the cards', async () => {
    renderSettings()
    // Username prefill and current email prove the data plumbing works
    await expect.element(page.getByLabelText('Username')).toHaveValue('jeff')
    await expect.element(page.getByText('Currently jeff@example.com')).toBeInTheDocument()
  })
})
