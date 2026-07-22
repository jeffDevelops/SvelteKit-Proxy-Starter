/* oxlint-disable no-console */
import { fileURLToPath } from 'url'
import { config } from 'dotenv'
import postgres from 'postgres'

// Self-loads the root .env instead of a `dotenv` CLI wrapper: on GitHub
// runners a preinstalled Ruby dotenv gem shadows the JS one and crashes on
// the missing file. dotenv.config is a no-op when the file doesn't exist
// (CI provides DATABASE_URL directly) and never overrides existing vars.
config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)), quiet: true })

const url = process.env.DATABASE_URL
if (!url) {
  console.warn('[e2e teardown] DATABASE_URL not set — skipping cleanup')
  process.exit(0)
}

const sql = postgres(url, { max: 1 })

// Reset-password rows store the user id in `value` (identifier is the token),
// and the verification table has no FK — clean these before their users.
const deletedVerifications = await sql`
  DELETE FROM verification
  WHERE value IN (SELECT id FROM "user" WHERE lower(name) LIKE 'e2e%')
  RETURNING id`
if (deletedVerifications.length > 0)
  console.log(`[e2e teardown] deleted ${deletedVerifications.length} verification row(s)`)

const deleted = await sql`DELETE FROM "user" WHERE lower(name) LIKE 'e2e%' RETURNING id`
if (deleted.length > 0) console.log(`[e2e teardown] deleted ${deleted.length} test user(s)`)

// Rate-limit counters are keyed by IP+path; the e2e suite spoofs addresses
// from TEST-NET-3 (203.0.113.0/24), which can never be real clients.
const deletedRateLimits =
  await sql`DELETE FROM rate_limit WHERE key LIKE '203.0.113.%' RETURNING id`
if (deletedRateLimits.length > 0)
  console.log(`[e2e teardown] deleted ${deletedRateLimits.length} rate-limit row(s)`)

// IP bans created by the admin e2e also use TEST-NET-3 addresses
const deletedIpBans = await sql`DELETE FROM banned_ip WHERE ip LIKE '203.0.113.%' RETURNING id`
if (deletedIpBans.length > 0)
  console.log(`[e2e teardown] deleted ${deletedIpBans.length} ip-ban row(s)`)
await sql.end()
