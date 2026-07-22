import { expect, test, type APIRequestContext, type Page } from '@playwright/test'
import { SIGN_IN_FAILED_MESSAGE } from '../../../lib/validation'
import { signUp } from '../../../../e2e-utils/account'

// Unique per run so the suite never collides with existing dev-database rows
const runId = `e2esignin${Date.now().toString(36)}`
const email = `${runId}@example.com`
const password = 'password123'

// Phrases that would confirm an account exists (or doesn't) on the platform
const ENUMERATION_PHRASES =
  /no account|not found|does not exist|already exists|unknown user|taken|registered/i

async function submitSignIn(page: Page, email: string, password: string) {
  await page.goto('/app/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign In', exact: true }).click()
}

test.describe.serial('sign in', () => {
  test('seed: creates the account under test via sign up', async ({ page }) => {
    await signUp(page, { username: runId, email, password })
  })

  test('signs in with valid credentials and lands in the app', async ({ page }) => {
    await submitSignIn(page, email, password)
    await expect(page).toHaveURL(/\/app$/)
  })

  test('rejects a wrong password without saying which part was wrong', async ({ page }) => {
    await submitSignIn(page, email, 'wrong-password')

    await expect(page.getByRole('alert')).toContainText(SIGN_IN_FAILED_MESSAGE)
    await expect(page).toHaveURL(/\/app\/sign-in$/)
    expect(await page.locator('body').innerText()).not.toMatch(ENUMERATION_PHRASES)
  })

  test('rejects an unknown email with the identical message as a wrong password', async ({
    page,
  }) => {
    await submitSignIn(page, `nobody.${runId}@example.com`, password)

    await expect(page.getByRole('alert')).toContainText(SIGN_IN_FAILED_MESSAGE)
    await expect(page).toHaveURL(/\/app\/sign-in$/)
    expect(await page.locator('body').innerText()).not.toMatch(ENUMERATION_PHRASES)
  })

  test('redirects an already signed-in user straight to the app', async ({ page }) => {
    await submitSignIn(page, email, password)
    await expect(page).toHaveURL(/\/app$/)

    await page.goto('/app/sign-in')
    await expect(page).toHaveURL(/\/app$/)
  })
})

// Rate limiting runs against a second API instance (port 3002, started with
// RATE_LIMIT_ENABLED=true in playwright.config.ts) — enabling the limiter on
// the shared instance would trip its 3-attempts-per-10s sign-in rule under
// the serial sign-ins above. Requests hit the API directly with spoofed
// x-forwarded-for addresses from TEST-NET-3 (203.0.113.0/24; teardown deletes
// rate_limit rows by that prefix). Trusting the header is safe because the
// API is internal-only: in production nothing reaches it except the SvelteKit
// proxy, which overwrites x-forwarded-for with the real connection address
// (covered by the proxy unit spec).
test.describe.serial('sign-in rate limiting (rate-limited API instance)', () => {
  const SIGN_IN_URL = 'http://127.0.0.1:3002/api/auth/sign-in/email'
  const attempt = (request: APIRequestContext, ip: string) =>
    request.post(SIGN_IN_URL, {
      headers: { origin: 'http://localhost:4173', 'x-forwarded-for': ip },
      data: { email: `limited.${runId}@example.com`, password: 'wrong-password' },
    })

  test('blocks the fourth rapid attempt and lifts the block after the window', async ({
    request,
  }) => {
    for (let i = 0; i < 3; i++) {
      // Failed sign-ins (401) must pass through — the limiter only counts
      const res = await attempt(request, '203.0.113.1')
      expect(res.status()).not.toBe(429)
    }

    const blocked = await attempt(request, '203.0.113.1')
    expect(blocked.status()).toBe(429)

    const retryAfter = Number(blocked.headers()['x-retry-after'])
    expect(retryAfter).toBeGreaterThan(0)
    expect(retryAfter).toBeLessThanOrEqual(10)

    await new Promise((resolve) => setTimeout(resolve, (retryAfter + 1) * 1000))
    const recovered = await attempt(request, '203.0.113.1')
    expect(recovered.status()).not.toBe(429)
  })

  test('does not affect attempts from other addresses', async ({ request }) => {
    const res = await attempt(request, '203.0.113.2')
    expect(res.status()).not.toBe(429)
  })
})
