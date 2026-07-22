import { relations, sql } from 'drizzle-orm'
import {
  pgTable,
  text,
  timestamp,
  boolean,
  bigint,
  index,
  integer,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const user = pgTable(
  'user',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('email_verified').default(false).notNull(),
    image: text('image'),
    twoFactorEnabled: boolean('two_factor_enabled').default(false).notNull(),
    // Soft delete (repo convention: user records have compliance value).
    // Better Auth's hard delete is aborted by the beforeDelete hook in
    // apps/api; a session-create hook blocks sign-in while this is set.
    deletedAt: timestamp('deleted_at'),
    // better-auth admin plugin: 'user' (default) or 'admin'. Platform bans
    // block session creation until banExpires (or forever when null); the
    // plugin auto-lifts expired bans on the next sign-in attempt.
    role: text('role').default('user').notNull(),
    banned: boolean('banned').default(false).notNull(),
    banReason: text('ban_reason'),
    banExpires: timestamp('ban_expires'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  // Usernames are unique case-insensitively so "Kalman" can't impersonate "kalman"
  (table) => [uniqueIndex('user_name_lower_unique_idx').on(sql`lower(${table.name})`)],
)

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    // Admin id when this session was minted via /admin/impersonate-user
    impersonatedBy: text('impersonated_by'),
  },
  (table) => [index('session_userId_idx').on(table.userId)],
)

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('account_userId_idx').on(table.userId)],
)

export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)],
)

// Counters for Better Auth's rate limiter (storage: 'database'). `key` is
// IP+path; `lastRequest` is a ms epoch. Rows are transient — the limiter
// prunes expired ones in the background. The unique index on `key` is
// load-bearing: concurrent first requests race on create, and the limiter
// recovers from the conflict only if the database actually rejects the
// duplicate.
export const rateLimit = pgTable(
  'rate_limit',
  {
    id: text('id').primaryKey(),
    key: text('key').notNull().unique(),
    count: integer('count').notNull(),
    lastRequest: bigint('last_request', { mode: 'number' }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  // The background prune deletes by lastRequest < cutoff
  (table) => [index('rate_limit_last_request_idx').on(table.lastRequest)],
)

// WebAuthn credentials (@better-auth/passkey). `counter` is the signature
// counter from the authenticator — small integers in practice, but the spec
// allows the full uint32 range. `credentialID` is looked up on every
// passkey sign-in; `aaguid` identifies the authenticator model so the UI can
// label passkeys ("Windows Hello", "1Password", …).
export const passkey = pgTable(
  'passkey',
  {
    id: text('id').primaryKey(),
    name: text('name'),
    publicKey: text('public_key').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    credentialID: text('credential_id').notNull(),
    counter: bigint('counter', { mode: 'number' }).notNull(),
    deviceType: text('device_type').notNull(),
    backedUp: boolean('backed_up').notNull(),
    transports: text('transports'),
    aaguid: text('aaguid'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index('passkey_userId_idx').on(table.userId),
    index('passkey_credentialID_idx').on(table.credentialID),
  ],
)

// TOTP secrets + backup codes (better-auth/plugins/two-factor). `secret` and
// `backupCodes` are stored encrypted by Better Auth; `failedVerificationCount`
// and `lockedUntil` drive the plugin's brute-force lockout.
export const twoFactor = pgTable(
  'two_factor',
  {
    id: text('id').primaryKey(),
    secret: text('secret').notNull(),
    backupCodes: text('backup_codes').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    verified: boolean('verified').default(true).notNull(),
    failedVerificationCount: integer('failed_verification_count').default(0).notNull(),
    lockedUntil: timestamp('locked_until'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index('two_factor_userId_idx').on(table.userId),
    index('two_factor_secret_idx').on(table.secret),
  ],
)

// Admin-managed IP bans — a deliberate speed bump, not a durable control
// (VPN-heavy audience, CGNAT collateral risk): enforced on the API's auth
// paths, where the proxy-overwritten x-forwarded-for is trustworthy.
// Long-term edge enforcement belongs to Cloudflare rules.
export const bannedIp = pgTable(
  'banned_ip',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ip: text('ip').notNull(),
    reason: text('reason'),
    // NULL = until lifted
    expiresAt: timestamp('expires_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('banned_ip_ip_idx').on(table.ip)],
)

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  passkeys: many(passkey),
  twoFactors: many(twoFactor),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}))

export const passkeyRelations = relations(passkey, ({ one }) => ({
  user: one(user, {
    fields: [passkey.userId],
    references: [user.id],
  }),
}))

export const twoFactorRelations = relations(twoFactor, ({ one }) => ({
  user: one(user, {
    fields: [twoFactor.userId],
    references: [user.id],
  }),
}))
