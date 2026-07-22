import { describe, expect, it } from 'bun:test'
import { passkeyConfig } from './passkey-config'

describe('passkeyConfig', () => {
  it('derives rpID from the BETTER_AUTH_URL hostname', () => {
    expect(passkeyConfig({ BETTER_AUTH_URL: 'https://app.example.com' }).rpID).toBe(
      'app.example.com',
    )
    expect(passkeyConfig({ BETTER_AUTH_URL: 'http://localhost:4173' }).rpID).toBe('localhost')
  })

  it('brands the relying party with the app name', () => {
    expect(passkeyConfig({ BETTER_AUTH_URL: 'https://app.example.com' }).rpName).toBe('auth-starter')
  })

  it('allows ceremonies from the base origin', () => {
    expect(passkeyConfig({ BETTER_AUTH_URL: 'https://app.example.com' }).origin).toEqual([
      'https://app.example.com',
    ])
  })

  it('also allows ceremonies from every trusted origin', () => {
    const { origin } = passkeyConfig({
      BETTER_AUTH_URL: 'https://app.example.com',
      TRUSTED_ORIGINS: 'http://localhost:4173,http://localhost:5173',
    })
    expect(origin).toEqual([
      'https://app.example.com',
      'http://localhost:4173',
      'http://localhost:5173',
    ])
  })

  it('normalizes to bare origins and drops duplicates', () => {
    const { origin } = passkeyConfig({
      // Trailing slashes and paths are invalid WebAuthn origins — the check
      // compares against the browser's `location.origin` exactly.
      BETTER_AUTH_URL: 'http://localhost:4173/',
      TRUSTED_ORIGINS: 'http://localhost:4173/app, http://localhost:5173',
    })
    expect(origin).toEqual(['http://localhost:4173', 'http://localhost:5173'])
  })
})
