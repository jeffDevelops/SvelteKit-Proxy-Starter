/* oxlint-disable no-console */
import { fileURLToPath } from 'url'
import { config } from 'dotenv'
import { createDb } from '../createDb'
import { setUserRole } from '../queries/user'

// Same self-loading pattern as teardown-e2e.ts — see the note there.
config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)), quiet: true })

// Bootstraps the first admin (and repairs access later): only admins can
// assign roles through the API, so the very first one is set here.
//   bun run make-admin -- someone@example.com
const email = process.argv[2]
if (!email) {
  console.error('usage: bun run make-admin -- <email>')
  process.exit(1)
}

const url = process.env.DATABASE_URL
if (!url) {
  console.error('[make-admin] DATABASE_URL not set')
  process.exit(1)
}

const db = createDb(url)
const promoted = await setUserRole(db, email, 'admin')

if (!promoted) {
  console.error('[make-admin] no account found for that email')
  process.exit(1)
}
console.log('[make-admin] role set to admin')
process.exit(0)
