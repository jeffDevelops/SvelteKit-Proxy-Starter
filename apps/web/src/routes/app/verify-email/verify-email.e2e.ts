import { expect, test } from '@playwright/test'
import { signUp } from '../../../../e2e-utils/account'
import { extractLink, waitForEmailTo } from '../../../../e2e-utils/outbox'

// Unique per run so the suite never collides with existing dev-database rows
const runId = `e2e${Date.now().toString(36)}vm`
const email = `${runId}@example.com`
const password = 'password123'

test.describe.serial('email verification', () => {
  test('sign-up sends a confirmation email and the banner nags until it is used', async ({
    page,
  }) => {
    await signUp(page, { username: runId, email, password })

    // Unverified account → banner with the address we mailed
    const banner = page.getByRole('status')
    await expect(banner).toContainText('Confirm your email')
    await expect(banner).toContainText(email)

    // The email arrives in the outbox and its link goes through the web proxy
    const message = await waitForEmailTo(email, { subject: /confirm/i })
    const link = extractLink(message)
    expect(link).toContain('/api/auth/verify-email')

    // Following the link verifies the address and lands on the success page
    await page.goto(link)
    await expect(page).toHaveURL(/\/app\/verify-email$/)
    await expect(page.getByRole('status')).toContainText('Email confirmed')

    // Banner is gone once verified
    await page.goto('/app')
    await expect(page.getByText('Welcome,')).toBeVisible()
    await expect(page.getByRole('status')).toHaveCount(0)
  })

  test('a tampered link fails without verifying anything', async ({ page }) => {
    await page.goto('/api/auth/verify-email?token=garbage&callbackURL=/app/verify-email')
    await expect(page).toHaveURL(/\/app\/verify-email\?error=/)
    await expect(page.getByRole('alert')).toContainText(/invalid or has expired/i)
  })
})
