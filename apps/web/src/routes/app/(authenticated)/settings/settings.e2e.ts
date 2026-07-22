import { expect, test } from '@playwright/test'
import {
  DELETE_ACCOUNT_EMAIL_SENT_MESSAGE,
  EMAIL_CHANGE_APPROVED_MESSAGE,
  EMAIL_CHANGE_COMPLETED_MESSAGE,
  OTHER_SESSIONS_REVOKED_MESSAGE,
  PASSKEY_ADDED_MESSAGE,
  PASSKEY_REMOVED_MESSAGE,
  PASSWORD_CHANGED_MESSAGE,
  SESSION_REVOKED_MESSAGE,
  SIGN_IN_FAILED_MESSAGE,
  SIGN_UP_CONFLICT_MESSAGE,
  TWO_FACTOR_DISABLED_MESSAGE,
  TWO_FACTOR_ENABLED_MESSAGE,
  USERNAME_UPDATED_MESSAGE,
  emailChangeApprovalRequestedMessage,
  emailChangeRequestedMessage,
} from '../../../../lib/validation'
import { signUp } from '../../../../../e2e-utils/account'
import { extractLink, waitForEmailTo } from '../../../../../e2e-utils/outbox'
import { totpCode } from '../../../../../e2e-utils/totp'

// Unique per run so the suite never collides with existing dev-database rows
const runId = `e2e${Date.now().toString(36)}st`
const password = 'password123'

// One serial flow: sign up, verify, then walk every settings mutation in
// order. The account is verified first so the email change exercises the
// full two-leg flow: approval from the OLD inbox, then verification from
// the NEW inbox — only the second click changes the address.
test('account settings golden path', async ({ page }) => {
  const email = `${runId}@example.com`
  const newEmail = `${runId}.new@example.com`
  const newPassword = 'rotated-password-789'

  await signUp(page, { username: runId, email, password })

  // Verify the account so the change-email flow requires approval
  const signUpVerification = await waitForEmailTo(email, {
    subject: /^Confirm your auth-starter email address$/,
  })
  await page.goto(extractLink(signUpVerification))
  await expect(page).toHaveURL(/\/app\/verify-email$/)

  // ── Username ──────────────────────────────────────────────────────────────
  await page.goto('/app/settings')
  const renamed = `${runId}_renamed`
  await page.getByLabel('Username').fill(renamed)
  await page.getByRole('button', { name: 'Change username' }).click()
  await expect(page.getByText(USERNAME_UPDATED_MESSAGE)).toBeVisible()
  // The sidebar reflects the new name after session data refreshes
  await expect(page.getByRole('button', { name: renamed })).toBeVisible()

  // ── Email: leg 1 — approval link goes to the CURRENT address ─────────────
  await page.getByLabel('New email').fill(newEmail)
  await page.getByRole('button', { name: 'Change email' }).click()
  await expect(page.getByText(emailChangeApprovalRequestedMessage(email))).toBeVisible()

  const approval = await waitForEmailTo(email, {
    subject: /^Approve your auth-starter email change$/,
  })
  await page.goto(extractLink(approval))
  await expect(page).toHaveURL(/\/app\/settings\?email-change=approved$/)
  await expect(page.getByText(EMAIL_CHANGE_APPROVED_MESSAGE)).toBeVisible()
  // The address hasn't changed yet — only the approval was recorded
  await expect(page.getByText(`Currently ${email}`)).toBeVisible()

  // ── Email: leg 2 — verification link goes to the NEW address ─────────────
  const verification = await waitForEmailTo(newEmail, {
    subject: /^Confirm your new auth-starter email address$/,
  })
  await page.goto(extractLink(verification))
  await expect(page).toHaveURL(/\/app\/settings\?email-change=completed$/)
  await expect(page.getByText(EMAIL_CHANGE_COMPLETED_MESSAGE)).toBeVisible()
  await expect(page.getByText(`Currently ${newEmail}`)).toBeVisible()

  // ── Password ──────────────────────────────────────────────────────────────
  await page.getByLabel('Current password').fill(password)
  await page.getByLabel('New password').fill(newPassword)
  await page.getByRole('button', { name: 'Change password' }).click()
  await expect(page.getByText(PASSWORD_CHANGED_MESSAGE)).toBeVisible()

  // The new credentials (changed email + changed password) sign in
  await page.context().clearCookies()
  await page.goto('/app/sign-in')
  await page.getByLabel('Email').fill(newEmail)
  await page.getByLabel('Password').fill(newPassword)
  await page.getByRole('button', { name: 'Sign In', exact: true }).click()
  await expect(page).toHaveURL(/\/app$/)
})

// Full passkey lifecycle against the real WebAuthn stack: a CDP virtual
// authenticator (Chromium-only, which is the only browser this suite runs)
// stands in for Face ID/Windows Hello so the ceremony completes headlessly.
test('passkey golden path: register, sign in with it, remove it', async ({ page }) => {
  const username = `${runId}pk`
  const email = `${username}@example.com`

  const cdp = await page.context().newCDPSession(page)
  await cdp.send('WebAuthn.enable')
  await cdp.send('WebAuthn.addVirtualAuthenticator', {
    options: {
      protocol: 'ctap2',
      transport: 'internal',
      // Discoverable credential + user verification, so the passkey button
      // works with no username hint — the browser resolves the account.
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  })

  await signUp(page, { username, email, password })

  // ── Register ──────────────────────────────────────────────────────────────
  await page.goto('/app/settings')
  await expect(page.getByText('No passkeys yet.')).toBeVisible()
  await page.getByLabel('Passkey name').fill('e2e virtual key')
  await page.getByRole('button', { name: 'Add passkey' }).click()
  await expect(page.getByText(PASSKEY_ADDED_MESSAGE)).toBeVisible()
  await expect(page.getByText('e2e virtual key')).toBeVisible()

  // ── Sign in with it ───────────────────────────────────────────────────────
  await page.context().clearCookies()
  await page.goto('/app/sign-in')
  await page.getByRole('button', { name: 'Sign in with a passkey' }).click()
  await expect(page).toHaveURL(/\/app$/)

  // ── Remove it ─────────────────────────────────────────────────────────────
  await page.goto('/app/settings')
  await page.getByRole('button', { name: 'Remove e2e virtual key' }).click()
  await expect(page.getByText(PASSKEY_REMOVED_MESSAGE)).toBeVisible()
  await expect(page.getByText('No passkeys yet.')).toBeVisible()
})

// Real TOTP against the real stack: the e2e-utils generator computes the
// same codes an authenticator app would from the manual-entry key the
// settings page displays during enrollment.
test('two-factor golden path: enroll, challenge at sign-in, disable', async ({ page }) => {
  const username = `${runId}tf`
  const email = `${username}@example.com`

  await signUp(page, { username, email, password })

  // ── Enroll ────────────────────────────────────────────────────────────────
  await page.goto('/app/settings')
  await page.getByLabel('Account password').fill(password)
  await page.getByRole('button', { name: 'Enable two-factor' }).click()
  // Enrollment isn't done yet — a code must verify first
  const secret = (await page.getByTestId('totp-secret').textContent()) ?? ''
  expect(secret.length).toBeGreaterThan(0)
  await page.getByLabel('Verification code').fill(totpCode(secret))
  await page.getByRole('button', { name: 'Confirm code' }).click()
  await expect(page.getByText(TWO_FACTOR_ENABLED_MESSAGE)).toBeVisible()

  // ── Password alone now routes to the challenge page ──────────────────────
  await page.context().clearCookies()
  await page.goto('/app/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign In', exact: true }).click()
  await expect(page).toHaveURL(/\/app\/two-factor$/)
  await page.getByLabel('Verification code').fill(totpCode(secret))
  await page.getByRole('button', { name: 'Verify' }).click()
  await expect(page).toHaveURL(/\/app$/)

  // ── Disable ───────────────────────────────────────────────────────────────
  await page.goto('/app/settings')
  await page.getByLabel('Account password').fill(password)
  await page.getByRole('button', { name: 'Disable two-factor' }).click()
  await expect(page.getByText(TWO_FACTOR_DISABLED_MESSAGE)).toBeVisible()

  // ── Password alone signs in again ─────────────────────────────────────────
  await page.context().clearCookies()
  await page.goto('/app/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign In', exact: true }).click()
  await expect(page).toHaveURL(/\/app$/)
})

// A second "device" is a separate Playwright request context with its own
// cookie jar; a distinctive user agent makes its row identifiable.
test('session management: another device appears, gets signed out, and stays out', async ({
  page,
  playwright,
}) => {
  const username = `${runId}sm`
  const email = `${username}@example.com`
  const firefoxLinux = 'Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0'

  await signUp(page, { username, email, password })

  const otherDevice = await playwright.request.newContext({
    baseURL: 'http://localhost:4173',
    extraHTTPHeaders: { origin: 'http://localhost:4173', 'user-agent': firefoxLinux },
  })
  const signIn = await otherDevice.post('/api/auth/sign-in/email', {
    data: { email, password },
  })
  expect(signIn.ok()).toBeTruthy()

  // ── Both devices are listed; only the other one can be revoked ───────────
  await page.goto('/app/settings')
  await expect(page.getByText('This device', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Sign out Firefox on Linux' }).click()
  await expect(page.getByText(SESSION_REVOKED_MESSAGE)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sign out Firefox on Linux' })).toHaveCount(0)

  // The revoked device's session is dead server-side, not just hidden
  const probe = await otherDevice.get('/api/auth/get-session')
  expect(await probe.text()).not.toContain('"user"')
  await otherDevice.dispose()

  // ── Sign out other devices sweeps everything but the current one ─────────
  const thirdDevice = await playwright.request.newContext({
    baseURL: 'http://localhost:4173',
    extraHTTPHeaders: { origin: 'http://localhost:4173', 'user-agent': firefoxLinux },
  })
  expect(
    (await thirdDevice.post('/api/auth/sign-in/email', { data: { email, password } })).ok(),
  ).toBeTruthy()

  await page.reload()
  await expect(page.getByRole('button', { name: 'Sign out Firefox on Linux' })).toBeVisible()
  await page.getByRole('button', { name: 'Sign out other devices' }).click()
  await expect(page.getByText(OTHER_SESSIONS_REVOKED_MESSAGE)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sign out Firefox on Linux' })).toHaveCount(0)
  await expect(page.getByText('This device', { exact: true })).toBeVisible()
  await thirdDevice.dispose()
})

// Deletion is soft (repo convention — user rows have compliance value):
// the flow must end with the account unusable but the row still present,
// which the final sign-up attempt proves via the email conflict.
test('account deletion: email confirmation, lockout, and the row survives', async ({ page }) => {
  const username = `${runId}del`
  const email = `${username}@example.com`

  await signUp(page, { username, email, password })

  // ── Request deletion (nothing happens until the email confirms) ──────────
  await page.goto('/app/settings')
  await page.getByLabel('Confirm your password').fill(password)
  await page.getByRole('button', { name: 'Delete account' }).click()
  await expect(page.getByText(DELETE_ACCOUNT_EMAIL_SENT_MESSAGE)).toBeVisible()

  const confirmation = await waitForEmailTo(email, {
    subject: /^Confirm deletion of your auth-starter account$/,
  })
  await page.goto(extractLink(confirmation))
  await expect(page).toHaveURL(/\/app\/account-deleted$/)

  // ── Old credentials are locked out with the generic message ──────────────
  await page.goto('/app/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign In', exact: true }).click()
  await expect(page.getByText(SIGN_IN_FAILED_MESSAGE)).toBeVisible()

  // ── Soft-delete proof: the email is still taken by the surviving row ─────
  await page.goto('/app/sign-up')
  await page.getByLabel('Username').fill(`${username}x`)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign Up' }).click()
  await expect(page.getByText(SIGN_UP_CONFLICT_MESSAGE)).toBeVisible()
})

// An unverified account has nothing to hijack yet, so the change collapses
// to a single leg: verification goes straight to the NEW address.
test('unverified account changes email in a single step', async ({ page }) => {
  const username = `${runId}u`
  const email = `${username}@example.com`
  const newEmail = `${username}.new@example.com`

  await signUp(page, { username, email, password })

  await page.goto('/app/settings')
  await page.getByLabel('New email').fill(newEmail)
  await page.getByRole('button', { name: 'Change email' }).click()
  await expect(page.getByText(emailChangeRequestedMessage(newEmail))).toBeVisible()

  const verification = await waitForEmailTo(newEmail, {
    subject: /^Confirm your new auth-starter email address$/,
  })
  await page.goto(extractLink(verification))
  await expect(page).toHaveURL(/\/app\/settings\?email-change=completed$/)
  await expect(page.getByText(EMAIL_CHANGE_COMPLETED_MESSAGE)).toBeVisible()
  await expect(page.getByText(`Currently ${newEmail}`)).toBeVisible()
})
