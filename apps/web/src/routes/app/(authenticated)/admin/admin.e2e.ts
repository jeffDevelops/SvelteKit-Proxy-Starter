import { execSync } from 'child_process'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { expect, test } from '@playwright/test'
import {
  ACCOUNT_SUSPENDED_MESSAGE,
  CANNOT_BAN_OWN_IP_MESSAGE,
  IP_BAN_ADDED_MESSAGE,
  IP_BAN_REMOVED_MESSAGE,
  USER_BANNED_MESSAGE,
  USER_UNBANNED_MESSAGE,
} from '../../../../lib/validation'
import { signUp } from '../../../../../e2e-utils/account'

// Unique per run so the suite never collides with existing dev-database rows
const runId = `e2e${Date.now().toString(36)}ad`
const password = 'password123'

const dbPackage = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../../../../../packages/db',
)

// The first admin can't be minted through the UI — bootstrap the same way
// an operator would, via the make-admin script.
function promoteToAdmin(email: string) {
  execSync(`bun run make-admin ${email}`, { cwd: dbPackage, env: process.env, stdio: 'pipe' })
}

async function signIn(page: import('@playwright/test').Page, email: string) {
  await page.goto('/app/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign In', exact: true }).click()
}

test('platform bans: admin bans a user, sign-in is blocked, unban restores it', async ({
  page,
  request,
}) => {
  const adminUser = `${runId}adm`
  const adminEmail = `${adminUser}@example.com`
  const target = `${runId}tgt`
  const targetEmail = `${target}@example.com`

  // A member to ban, then the soon-to-be admin
  await signUp(page, { username: target, email: targetEmail, password })
  await page.context().clearCookies()
  await signUp(page, { username: adminUser, email: adminEmail, password })
  promoteToAdmin(adminEmail)

  // ── Admin reaches the page via the sidebar dropdown ───────────────────────
  await page.goto('/app')
  await page.getByRole('button', { name: adminUser }).click()
  await page.getByRole('menuitem', { name: 'Admin' }).click()
  await expect(page).toHaveURL(/\/app\/admin$/)

  // ── Ban the target with a reason ──────────────────────────────────────────
  await page.getByLabel('Search by username or email').fill(target)
  await page.getByRole('button', { name: 'Search' }).click()
  await page.getByRole('button', { name: `Ban ${target}` }).click()
  await page.getByLabel('Ban reason').fill('e2e: content exfiltration')
  await page.getByRole('button', { name: 'Confirm ban' }).click()
  await expect(page.getByText(USER_BANNED_MESSAGE)).toBeVisible()
  await expect(page.getByText('Banned: e2e: content exfiltration')).toBeVisible()

  // ── Banned account can't sign in, and is told why ─────────────────────────
  await page.context().clearCookies()
  await signIn(page, targetEmail)
  await expect(page.getByText(ACCOUNT_SUSPENDED_MESSAGE)).toBeVisible()

  // ── Unban restores access ─────────────────────────────────────────────────
  await signIn(page, adminEmail)
  await expect(page).toHaveURL(/\/app$/)
  await page.goto('/app/admin')
  await page.getByLabel('Search by username or email').fill(target)
  await page.getByRole('button', { name: 'Search' }).click()
  await page.getByRole('button', { name: `Unban ${target}` }).click()
  await expect(page.getByText(USER_UNBANNED_MESSAGE)).toBeVisible()

  // ── IP bans block auth actions from that address immediately ──────────────
  // Direct API calls with a spoofed TEST-NET-3 x-forwarded-for, same
  // technique as the rate-limit suite — the proxy overwrites the header, so
  // only direct calls can simulate another address.
  const bannedAddress = '203.0.113.99'
  const attemptFromBannedIp = () =>
    request.post('http://127.0.0.1:3001/api/auth/sign-in/email', {
      headers: { origin: 'http://localhost:4173', 'x-forwarded-for': bannedAddress },
      data: { email: targetEmail, password },
    })

  await page.getByLabel('IP address').fill(bannedAddress)
  await page.getByLabel('Reason').fill('e2e scraper farm')
  await page.getByRole('button', { name: 'Ban IP' }).click()
  await expect(page.getByText(IP_BAN_ADDED_MESSAGE)).toBeVisible()

  const blocked = await attemptFromBannedIp()
  expect(blocked.status()).toBe(403)
  expect((await blocked.json()).code).toBe('IP_BANNED')

  await page.getByRole('button', { name: `Remove ban on ${bannedAddress}` }).click()
  await expect(page.getByText(IP_BAN_REMOVED_MESSAGE)).toBeVisible()
  const unblocked = await attemptFromBannedIp()
  expect(unblocked.status()).not.toBe(403)

  // ── Self-IP guard: the admin can't ban the address they're on ────────────
  await page.getByLabel('IP address').fill('127.0.0.1')
  await page.getByRole('button', { name: 'Ban IP' }).click()
  await expect(page.getByText(CANNOT_BAN_OWN_IP_MESSAGE)).toBeVisible()

  await page.context().clearCookies()
  await signIn(page, targetEmail)
  await expect(page).toHaveURL(/\/app$/)

  // ── Non-admins never see the page ─────────────────────────────────────────
  await page.goto('/app/admin')
  await expect(page).toHaveURL(/\/app$/)
})
