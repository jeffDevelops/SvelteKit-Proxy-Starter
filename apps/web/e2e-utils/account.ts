import { expect, type Page } from '@playwright/test'

// The standard e2e preamble: create a fresh account through the real sign-up
// form and land in the app. Usernames must start with `e2e` so the teardown
// script (packages/db/scripts/teardown-e2e.ts) sweeps them.
export async function signUp(
  page: Page,
  { username, email, password }: { username: string; email: string; password: string },
) {
  await page.goto('/app/sign-up')
  await page.getByLabel('Username').fill(username)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign Up' }).click()
  await expect(page).toHaveURL(/\/app$/)
}
