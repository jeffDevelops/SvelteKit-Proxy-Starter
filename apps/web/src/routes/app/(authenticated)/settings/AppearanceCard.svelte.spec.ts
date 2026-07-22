import { page } from 'vitest/browser'
import AppearanceCard from './AppearanceCard.svelte'
import { beforeEach, describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-svelte'

describe('AppearanceCard', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('offers the theme toggle', async () => {
    render(AppearanceCard)
    await expect.element(page.getByText('Appearance')).toBeInTheDocument()
    await expect.element(page.getByRole('group', { name: 'Theme' })).toBeInTheDocument()
  })

  it('switches the theme from the settings page', async () => {
    render(AppearanceCard)
    await page.getByRole('button', { name: 'Dark Theme' }).click()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})
