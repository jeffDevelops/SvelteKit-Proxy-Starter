import { defineConfig } from '@playwright/test'

export default defineConfig({
  globalTeardown: './e2e-teardown.ts',
  // With multiple webServer entries Playwright can't infer the base URL
  use: { baseURL: 'http://localhost:4173' },
  webServer: [
    // The e2e suite exercises the real SvelteKit → Hono → Postgres path, so
    // the internal API must be up (requires the dev database: `bun db:up`).
    // It runs on its own port with its own env — never reuse the long-running
    // dev API: that one may hold real Mailgun credentials, and e2e sign-ups
    // with @example.com addresses would bounce and burn sender reputation.
    // MAILGUN_API_KEY='' forces the dev file-outbox provider, which the email
    // e2e tests read to follow verification/reset links.
    {
      command: 'bun run --cwd ../api start:dev',
      port: 3001,
      reuseExistingServer: false,
      env: {
        PORT: '3001',
        BETTER_AUTH_URL: 'http://localhost:4173',
        TRUSTED_ORIGINS: 'http://localhost:4173',
        CLIENT_HOST: 'http://localhost:4173',
        MAILGUN_API_KEY: '',
        EMAIL_OUTBOX_DIR: '.e2e-outbox',
      },
    },
    // A second API instance with the rate limiter on. The sign-in rate-limit
    // e2e targets this one directly; the instance above keeps the limiter off
    // (test-env default) so the limiter's 3-attempts-per-10s sign-in rule
    // can't break the serial sign-in/sign-up suites.
    {
      command: 'bun run --cwd ../api start:dev',
      port: 3002,
      reuseExistingServer: false,
      env: {
        PORT: '3002',
        BETTER_AUTH_URL: 'http://localhost:4173',
        TRUSTED_ORIGINS: 'http://localhost:4173',
        CLIENT_HOST: 'http://localhost:4173',
        MAILGUN_API_KEY: '',
        EMAIL_OUTBOX_DIR: '.e2e-outbox',
        RATE_LIMIT_ENABLED: 'true',
      },
    },
    {
      command: 'npm run build && npm run preview',
      port: 4173,
      reuseExistingServer: true,
      // Auth requests must hit the preview server on localhost instead of
      // the tunneled dev host baked into .env. Must stay absolute — the auth
      // client is constructed during SSR, where relative URLs are invalid.
      env: {
        PUBLIC_CLIENT_HOST: 'http://localhost:4173',
        API_HOST: '127.0.0.1:3001',
      },
    },
  ],
  testMatch: '**/*.e2e.{ts,js}',
})
