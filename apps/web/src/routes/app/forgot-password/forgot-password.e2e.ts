import { expect, test, type Page } from '@playwright/test'
import { PASSWORD_RESET_SUCCESS_MESSAGE, RESET_LINK_SENT_MESSAGE } from '../../../lib/validation'
import { extractLink, waitForEmailTo } from '../../../../e2e-utils/outbox'

// Unique per run so the suite never collides with existing dev-database rows
const runId = `e2e${Date.now().toString(36)}fp`
const email = `${runId}@example.com`
const originalPassword = 'password123'
const newPassword = 'brand-new-password-456'

// Phrases that would confirm an account/username/email exists on the platform
const ENUMERATION_PHRASES =
  /already exists|already registered|taken|in use|unavailable|not found|no account/i

async function requestReset(page: Page, address: string) {
  await page.goto('/app/forgot-password')
  await page.getByLabel('Email').fill(address)
  await page.getByRole('button', { name: 'Send reset link' }).click()
  await expect(page.getByRole('status')).toContainText(RESET_LINK_SENT_MESSAGE)
}

let resetLink: string

test.describe.serial('forgot password', () => {
  test('resets a forgotten password end to end', async ({ page }) => {
    // An account to lock ourselves out of
    await page.goto('/app/sign-up')
    await page.getByLabel('Username').fill(runId)
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password').fill(originalPassword)
    await page.getByRole('button', { name: 'Sign Up' }).click()
    await expect(page).toHaveURL(/\/app$/)
    await page.context().clearCookies()

    await requestReset(page, email)

    const message = await waitForEmailTo(email, { subject: /reset/i })
    resetLink = extractLink(message)
    await page.goto(resetLink)
    await expect(page).toHaveURL(/\/app\/reset-password\?token=/)

    await page.getByLabel('New password').fill(newPassword)
    await page.getByRole('button', { name: 'Reset password' }).click()
    await expect(page.getByRole('status')).toContainText(PASSWORD_RESET_SUCCESS_MESSAGE)

    // The new password works
    await page.context().clearCookies()
    await page.goto('/app/sign-in')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password').fill(newPassword)
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()
    await expect(page).toHaveURL(/\/app$/)
  })

  test('the old password no longer works', async ({ page }) => {
    await page.goto('/app/sign-in')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password').fill(originalPassword)
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()
    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page).toHaveURL(/\/app\/sign-in$/)
  })

  test('a used reset link cannot be replayed', async ({ page }) => {
    await page.goto(resetLink)
    await expect(page).toHaveURL(/error=INVALID_TOKEN/)
    await expect(page.getByRole('alert')).toContainText(/invalid or has expired/i)
    await expect(page.getByRole('link', { name: 'Request a new link' })).toBeVisible()
  })

  test('shows the identical sent message for an unknown email', async ({ page }) => {
    await requestReset(page, `nobody.${runId}@example.com`)
    expect(await page.locator('body').innerText()).not.toMatch(ENUMERATION_PHRASES)
  })
})
