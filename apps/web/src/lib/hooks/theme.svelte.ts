import { browser } from '$app/environment'

export type ThemePreference = 'light' | 'dark' | 'system'

export const THEME_STORAGE_KEY = 'theme-preference'

const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)'

function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system'
}

/**
 * Owns the `.dark` class on <html> (the shadcn dark-mode custom variant),
 * persists the user's choice, and follows the OS color scheme while the
 * preference is `system`. The pre-hydration script in `app.html` reads the
 * same storage key so the first paint matches.
 */
export class Theme {
  preference: ThemePreference = $state('system')

  constructor() {
    if (!browser) return
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (isThemePreference(stored)) this.preference = stored
    this.#apply()
    window.matchMedia(DARK_SCHEME_QUERY).addEventListener('change', () => {
      if (this.preference === 'system') this.#apply()
    })
  }

  set = (preference: ThemePreference) => {
    this.preference = preference
    if (!browser) return
    localStorage.setItem(THEME_STORAGE_KEY, preference)
    this.#apply()
  }

  #apply() {
    const dark =
      this.preference === 'dark' ||
      (this.preference === 'system' && window.matchMedia(DARK_SCHEME_QUERY).matches)
    document.documentElement.classList.toggle('dark', dark)
    // theme-color can't read CSS variables — keep it in sync with --background in app.css
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    if (meta) meta.content = dark ? '#29292a' : '#ecebf3'
  }
}

export const theme = new Theme()
