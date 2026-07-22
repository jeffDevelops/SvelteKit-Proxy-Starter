import { page } from 'vitest/browser'
import AccountDeletedPage from './+page.svelte'
import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-svelte'

// The delete-account confirmation link lands here after the API soft-deletes
// the account and revokes every session — there is no signed-in user.
describe('Account Deleted Page', () => {
  it('confirms the account is gone', async () => {
    render(AccountDeletedPage)
    await expect.element(page.getByRole('heading', { name: 'Account deleted' })).toBeInTheDocument()
  })

  it('mentions that support can restore the account for a limited time', async () => {
    render(AccountDeletedPage)
    await expect.element(page.getByText(/restore/i)).toBeInTheDocument()
  })

  it('offers a way back to sign-up', async () => {
    render(AccountDeletedPage)
    const link = page.getByRole('link', { name: 'Sign Up' })
    await expect.element(link).toHaveAttribute('href', '/app/sign-up')
  })
})
