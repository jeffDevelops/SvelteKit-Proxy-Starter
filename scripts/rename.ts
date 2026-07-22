/* oxlint-disable no-console */
// Rebrands the template in place. Run once, right after cloning:
//
//   bun scripts/rename.ts my-app "My App"
//
// Replaces every form of the placeholder brand:
//   auth-starter  → my-app     (package scope, URLs, lowercase copy)
//   Auth Starter  → My App     (display copy, email subjects)
//   authstarter   → myapp      (reserved-username entry)
//
// The display name defaults to the kebab name title-cased. Re-run
// `bun install` afterwards so the lockfile picks up the renamed
// workspace packages.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'fs'
import { join } from 'path'

const KEBAB = 'auth-starter'
const DISPLAY = 'Auth Starter'
const SQUASHED = 'authstarter'

const SKIP_DIRS = new Set(['node_modules', '.git', '.svelte-kit', 'build', 'dist', 'migrations'])
const TEXT_EXTENSIONS = /\.(ts|js|svelte|json|jsonc|md|ya?ml|css|html|lock|example|toml)$/

const kebab = process.argv[2]
if (!kebab || !/^[a-z][a-z0-9-]*$/.test(kebab)) {
  console.error('usage: bun scripts/rename.ts <kebab-name> ["Display Name"]')
  console.error('       kebab-name must be lowercase letters, digits, and dashes')
  process.exit(1)
}
const display =
  process.argv[3] ??
  kebab
    .split('-')
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(' ')
const squashed = kebab.replace(/-/g, '')

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) {
      if (!SKIP_DIRS.has(entry)) yield* walk(path)
    } else if (TEXT_EXTENSIONS.test(entry) || entry === 'bun.lock') {
      yield path
    }
  }
}

let changed = 0
for (const path of walk(process.cwd())) {
  const before = readFileSync(path, 'utf8')
  const after = before
    .replaceAll(DISPLAY, display)
    .replaceAll(KEBAB, kebab)
    .replaceAll(SQUASHED, squashed)
  if (after !== before) {
    writeFileSync(path, after)
    changed += 1
  }
}

console.log(`[rename] ${KEBAB} → ${kebab} ("${display}") in ${changed} file(s)`)
console.log('[rename] next steps:')
console.log('  1. bun install            # refresh workspace links in the lockfile')
console.log('  2. replace apps/web/src/lib/components/svg/AppLogo.svelte with your logo')
console.log('  3. review apps/*/.env.example for host names')
