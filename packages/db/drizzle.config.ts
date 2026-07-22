import path from 'path'
import { fileURLToPath } from 'url'
import { config as readEnv } from 'dotenv'

import { defineConfig } from 'drizzle-kit'

const dirname = path.dirname(fileURLToPath(import.meta.url))

readEnv({
  path: path.join(dirname, '../../.env'),
})

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './schema/index.ts',
  out: './migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
})
