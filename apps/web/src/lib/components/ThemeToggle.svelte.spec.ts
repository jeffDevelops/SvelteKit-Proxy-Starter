import { page } from 'vitest/browser'
import ThemeToggle from './ThemeToggle.svelte'
import { beforeEach, describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-svelte'

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
})

describe('ThemeToggle', () => {
  it('renders a labeled group with light, dark, and system options', async () => {
    render(ThemeToggle)
    await expect.element(page.getByRole('group', { name: 'Theme' })).toBeInTheDocument()
    await expect.element(page.getByRole('button', { name: 'Light' })).toBeInTheDocument()
    await expect.element(page.getByRole('button', { name: 'Dark' })).toBeInTheDocument()
    await expect.element(page.getByRole('button', { name: 'System' })).toBeInTheDocument()
  })

  it('applies dark mode when Dark is clicked', async () => {
    render(ThemeToggle)
    await page.getByRole('button', { name: 'Dark' }).click()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('returns to light mode when Light is clicked', async () => {
    render(ThemeToggle)
    await page.getByRole('button', { name: 'Dark' }).click()
    await page.getByRole('button', { name: 'Light' }).click()
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('marks only the active preference as pressed', async () => {
    render(ThemeToggle)
    await page.getByRole('button', { name: 'Dark' }).click()
    await expect
      .element(page.getByRole('button', { name: 'Dark' }))
      .toHaveAttribute('aria-pressed', 'true')
    await expect
      .element(page.getByRole('button', { name: 'Light' }))
      .toHaveAttribute('aria-pressed', 'false')
    await expect
      .element(page.getByRole('button', { name: 'System' }))
      .toHaveAttribute('aria-pressed', 'false')
  })
})
