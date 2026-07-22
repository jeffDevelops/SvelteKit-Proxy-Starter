import { createConsoleLogger } from '@auth-starter/logging'
import { env } from './env'

// Structured JSON lines on stdout; Render (and any log shipper) ingests
// them as-is. Secrets never reach a line — the logger redacts by key name.
export const logger = createConsoleLogger({
  level: env.LOG_LEVEL ?? (env.NODE_ENV === 'production' ? 'info' : 'debug'),
  base: { service: 'api' },
})
