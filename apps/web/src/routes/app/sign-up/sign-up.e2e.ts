import { expect, test, type Page } from '@playwright/test'
import { SIGN_UP_CONFLICT_MESSAGE } from '../../../lib/validation'

// Unique per run so the suite never collides with existing dev-database rows
const runId = `e2e${Date.now().toString(36)}`
const password = 'password123'

// Phrases that would confirm an account/username/email exists on the platform
const ENUMERATION_PHRASES = /already exists|already registered|taken|in use|unavailable/i

async function submitSignUp(page: Page, username: string, email: string) {
  await page.goto('/app/sign-up')
  await page.getByLabel('Username').fill(username)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign Up' }).click()
}

test.describe.serial('sign up', () => {
  test('creates an account and lands in the app', async ({ page }) => {
    await submitSignUp(page, runId, `${runId}@example.com`)
    await expect(page).toHaveURL(/\/app$/)
  })

  test('rejects a duplicate username case-insensitively without confirming an account exists', async ({
    page,
  }) => {
    await submitSignUp(page, runId.toUpperCase(), `fresh.${runId}@example.com`)

    await expect(page.getByRole('alert')).toContainText(SIGN_UP_CONFLICT_MESSAGE)
    await expect(page).toHaveURL(/\/app\/sign-up$/)
    expect(await page.locator('body').innerText()).not.toMatch(ENUMERATION_PHRASES)
  })

  test('rejects a duplicate email without confirming an account exists', async ({ page }) => {
    await submitSignUp(page, `fresh_${runId}`, `${runId}@example.com`)

    await expect(page.getByRole('alert')).toContainText(SIGN_UP_CONFLICT_MESSAGE)
    await expect(page).toHaveURL(/\/app\/sign-up$/)
    expect(await page.locator('body').innerText()).not.toMatch(ENUMERATION_PHRASES)
  })

  test('shows the identical message for username and email conflicts', async ({ page }) => {
    await submitSignUp(page, runId, `fresh.${runId}@example.com`)
    const usernameConflictText = await page.getByRole('alert').innerText()

    await submitSignUp(page, `fresh_${runId}`, `${runId}@example.com`)
    const emailConflictText = await page.getByRole('alert').innerText()

    expect(usernameConflictText).toBe(emailConflictText)
  })
})

// The browser form blocks malformed usernames before submit, so these hit the
// proxied auth endpoint directly to prove the server enforces the same rules —
// a real attacker skips our client entirely.
test.describe('sign up — server-side username enforcement (direct API)', () => {
  const SIGN_UP_URL = '/api/auth/sign-up/email'
  // Better Auth's CSRF check compares Origin against trusted origins.
  const headers = { origin: 'http://localhost:4173' }

  test('rejects a malformed username the client would never send', async ({ request }) => {
    const res = await request.post(SIGN_UP_URL, {
      headers,
      data: { name: 'has spaces!', email: `sv1.${runId}@example.com`, password },
    })
    expect(res.ok()).toBe(false)
    expect((await res.json()).code).toBe('INVALID_USERNAME')
  })

  test('rejects an over-length username', async ({ request }) => {
    const res = await request.post(SIGN_UP_URL, {
      headers,
      data: { name: `e2e${'a'.repeat(40)}`, email: `sv2.${runId}@example.com`, password },
    })
    expect(res.ok()).toBe(false)
    expect((await res.json()).code).toBe('INVALID_USERNAME')
  })

  test('rejects a reserved username indistinguishably from a taken one', async ({ request }) => {
    const res = await request.post(SIGN_UP_URL, {
      headers,
      data: { name: 'admin', email: `sv3.${runId}@example.com`, password },
    })
    expect(res.ok()).toBe(false)
    // Same code a taken username returns — never reveals that it's reserved.
    expect((await res.json()).code).toBe('USERNAME_UNAVAILABLE')
  })
})
