import { execSync } from 'child_process'
import { rmSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const dir = dirname(fileURLToPath(import.meta.url))

export default async function teardown() {
  execSync('bun run teardown:e2e', {
    cwd: resolve(dir, '../../packages/db'),
    env: process.env,
    stdio: 'inherit',
  })
  // Emails captured by the e2e API instance's DevEmailProvider
  rmSync(resolve(dir, '../api/.e2e-outbox'), { recursive: true, force: true })
}
