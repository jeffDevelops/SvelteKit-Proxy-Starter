import { expect, test } from '@playwright/test'

const runId = `e2e${Date.now().toString(36)}fa`
const email = `${runId}@example.com`
const password = 'password123'

test.use({ browserName: 'webkit' })

test('settings heading renders Satoshi Variable at heading scale', async ({ page }) => {
  await page.goto('/app/sign-up')
  await page.getByLabel('Username').fill(runId)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign Up' }).click()
  await expect(page).toHaveURL(/\/app$/)

  await page.goto('/app/settings')
  const h1 = page.getByRole('heading', { name: 'Settings' })
  await expect(h1).toBeVisible()
  await page.evaluate(() => document.fonts.ready)

  const result = await h1.evaluate((el) => {
    const cs = getComputedStyle(el)
    return {
      family: cs.fontFamily,
      weight: cs.fontWeight,
      size: cs.fontSize,
      satoshiLoaded: document.fonts.check('800 24px "Satoshi Variable"'),
    }
  })
  expect(result.family).toContain('Satoshi Variable')
  expect(result.weight).toBe('800')
  expect(result.size).toBe('24px')
  expect(result.satoshiLoaded).toBe(true)
})
