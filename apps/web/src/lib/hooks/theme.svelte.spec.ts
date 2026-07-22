import { beforeEach, describe, expect, it } from 'vitest'
import { THEME_STORAGE_KEY, Theme } from './theme.svelte'

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
})

describe('Theme', () => {
  it('defaults to the system preference', () => {
    const theme = new Theme()
    expect(theme.preference).toBe('system')
  })

  it('applies the dark class to the document when set to dark', () => {
    const theme = new Theme()
    theme.set('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('removes the dark class from the document when set to light', () => {
    const theme = new Theme()
    theme.set('dark')
    theme.set('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('follows the OS color scheme when set to system', () => {
    const theme = new Theme()
    theme.set('dark')
    theme.set('system')
    const osPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    expect(document.documentElement.classList.contains('dark')).toBe(osPrefersDark)
  })

  it('persists the preference to localStorage', () => {
    const theme = new Theme()
    theme.set('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
  })

  it('restores a stored preference on construction', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    const theme = new Theme()
    expect(theme.preference).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('ignores an unrecognized stored value', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'hotdog-stand')
    const theme = new Theme()
    expect(theme.preference).toBe('system')
  })
})
