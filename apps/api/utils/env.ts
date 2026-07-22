/* oxlint-disable no-console -- startup validation reports before any logger exists */
import { z } from 'zod'

// .env.example templates leave optional vars as `VAR=`, which reaches us as
// an empty string — treat that the same as unset.
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema.optional())

// Validated once at startup (architecture: fail fast on missing config).
// Issues are printed without values — env vars are secrets.
const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_URL: z.url(),
  TRUSTED_ORIGINS: optional(z.string()),
  PORT: optional(z.coerce.number().int().positive()),
  NODE_ENV: optional(z.string()),
  // Overrides the default (rate limiting on only when NODE_ENV=production);
  // e2e sets it to enable the limiter on a dedicated API instance.
  RATE_LIMIT_ENABLED: optional(z.stringbool()),
  // Minimum level written by the structured logger; defaults to debug in
  // dev and info in production (see utils/logger.ts).
  LOG_LEVEL: optional(z.enum(['debug', 'info', 'warn', 'error'])),
  MAILGUN_API_KEY: optional(z.string()),
  MAILGUN_DOMAIN: optional(z.string()),
  MAILGUN_BASE_URL: optional(z.url()),
  EMAIL_FROM: optional(z.string()),
  EMAIL_OUTBOX_DIR: optional(z.string()),
})

export type Env = z.infer<typeof EnvSchema>

const parsed = EnvSchema.safeParse(process.env)

if (!parsed.success) {
  for (const issue of parsed.error.issues) {
    console.error(`[env] ${issue.path.join('.')}: ${issue.message}`)
  }
  process.exit(1)
}

export const env: Env = parsed.data
