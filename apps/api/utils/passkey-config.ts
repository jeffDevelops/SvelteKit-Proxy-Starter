import type { Env } from './env'

// Brand string shown in authenticator prompts ("Save a passkey for …?").
// Single obvious edit point when this repo is cloned as a project template.
const RP_NAME = 'auth-starter'

// WebAuthn binds credentials to the relying-party ID (a domain) and rejects
// ceremonies from unlisted origins, so both must track the environment: the
// public web origin is BETTER_AUTH_URL (auth is proxied through SvelteKit),
// and TRUSTED_ORIGINS covers extras like the vite preview server in e2e.
// Passkeys registered in one environment are inherently unusable in another —
// the browser scopes them by rpID.
export function passkeyConfig(env: Pick<Env, 'BETTER_AUTH_URL' | 'TRUSTED_ORIGINS'>): {
  rpID: string
  rpName: string
  origin: string[]
} {
  const base = new URL(env.BETTER_AUTH_URL)
  const trusted = env.TRUSTED_ORIGINS?.split(',') ?? []
  // The WebAuthn origin check compares against the browser's location.origin
  // exactly, so paths and trailing slashes must be normalized away.
  const origin = [
    ...new Set([base, ...trusted.map((raw) => new URL(raw.trim()))].map((url) => url.origin)),
  ]

  return { rpID: base.hostname, rpName: RP_NAME, origin }
}
