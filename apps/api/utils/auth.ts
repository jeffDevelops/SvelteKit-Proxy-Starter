import { betterAuth } from 'better-auth'
import { APIError } from 'better-auth/api'
import { admin, twoFactor } from 'better-auth/plugins'
import { passkey } from '@better-auth/passkey'
import { deleteUserSessions, isUserDeleted, isUsernameTaken, softDeleteUser } from '@auth-starter/db'
import { checkUsername } from '@auth-starter/validation'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { createEmailProvider } from '../providers/email'
import { accountDeletedRedirect, deleteAccountEmail } from './account-deletion'
import { db } from './db'
import { env } from './env'
import { logger } from './logger'
import { passkeyConfig } from './passkey-config'
import { verificationEmail } from './verification-email'

const email = createEmailProvider(env)
const webauthn = passkeyConfig(env)

// The SvelteKit client validates username format, but this is the
// authoritative check — a direct API caller skips the client. Rules are
// shared with the client via @auth-starter/validation.
const assertUsernameAllowed = async (name: string, excludeUserId?: string) => {
  const problem = checkUsername(name)

  // Format/length violations only reach here via API abuse; a distinct
  // code is fine because a legitimate client never triggers it.
  if (problem && problem !== 'reserved') {
    throw new APIError('BAD_REQUEST', {
      message: 'Invalid username',
      code: 'INVALID_USERNAME',
    })
  }

  // Reserved and already-taken names are indistinguishable to the
  // caller: same code, same message. Never echo the username or
  // confirm an account exists. Race-proof enforcement of uniqueness is
  // the user_name_lower_unique_idx index; this returns a mappable code.
  if (problem === 'reserved' || (await isUsernameTaken(db, name, excludeUserId))) {
    throw new APIError('UNPROCESSABLE_ENTITY', {
      message: 'These details cannot be used',
      code: 'USERNAME_UNAVAILABLE',
    })
  }
}

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: env.TRUSTED_ORIGINS?.split(',') ?? [],
  // Route Better Auth's internal logging through the structured logger so
  // its lines are JSON like everything else (and pass secret redaction).
  logger: {
    disabled: false,
    log: (level, message, ...args) => {
      logger[level]?.(message, args.length > 0 ? { details: args } : undefined)
    },
  },
  plugins: [
    passkey(webauthn),
    // Issuer is the label authenticator apps show next to the OTP; it
    // matches the passkey rpName (one edit point for template clones).
    twoFactor({ issuer: webauthn.rpName }),
    // Roles + platform bans. Bans block session creation on every sign-in
    // path and revoke existing sessions; expired bans lift automatically.
    // The first admin is bootstrapped via `bun run make-admin -- <email>`
    // in packages/db — only admins can assign roles through the API.
    admin(),
  ],
  rateLimit: {
    enabled: env.RATE_LIMIT_ENABLED ?? env.NODE_ENV === 'production',
    // Postgres-backed (rate_limit table) so limits hold across restarts and
    // instances; the default in-memory store resets on every deploy. Path
    // rules are Better Auth's defaults — sign-in/sign-up/change-password/
    // change-email at 3 per 10s per IP, reset/verification emails at 3 per
    // 60s, everything else 100 per 10s. The IP comes from x-forwarded-for,
    // which only the SvelteKit proxy can set (it overwrites the header with
    // the connection address it observed).
    storage: 'database',
  },
  emailAndPassword: {
    enabled: true,
    // Soft verification: unverified users can sign in; the web app nags via
    // a banner. Flip to true (or gate specific actions) before payments ship.
    requireEmailVerification: false,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await email.send({
        to: user.email,
        subject: 'Reset your auth-starter password',
        text:
          `Hi ${user.name},\n\n` +
          `Someone requested a password reset for your auth-starter account. ` +
          `If this was you, use the link below within the next hour:\n\n${url}\n\n` +
          `If you didn't request this, you can safely ignore this email — ` +
          `your password won't change.`,
      })
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    // Also covers the final leg of a change-email flow — the helper picks
    // the copy and fixes up the callback (see verification-email.ts).
    sendVerificationEmail: async ({ user, url }) => {
      await email.send(verificationEmail(user, url))
    },
  },
  user: {
    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification: async ({ user, url }) => {
        await email.send(deleteAccountEmail(user, url))
      },
      // Soft delete per the repo convention: mark the row, kill every
      // session, then abort Better Auth's hard delete with a redirect to
      // the goodbye page. The session-create hook below keeps the account
      // unusable while deletedAt is set.
      beforeDelete: async (user) => {
        await softDeleteUser(db, user.id)
        await deleteUserSessions(db, user.id)
        throw accountDeletedRedirect(env.BETTER_AUTH_URL)
      },
    },
    changeEmail: {
      enabled: true,
      // Sent to the *current* (verified) address so a hijacked session can't
      // silently move the account to an attacker-owned inbox.
      sendChangeEmailConfirmation: async ({ user, newEmail, url }) => {
        await email.send({
          to: user.email,
          subject: 'Approve your auth-starter email change',
          text:
            `Hi ${user.name},\n\n` +
            `A request was made to change your auth-starter account email to ` +
            `${newEmail}. If this was you, approve the change here:\n\n${url}\n\n` +
            `If you didn't request this, don't click the link — and consider ` +
            `changing your password.`,
        })
      },
    },
  },
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  databaseHooks: {
    session: {
      create: {
        // Every successful authentication (password, passkey, 2FA) mints a
        // session, so this one hook locks out soft-deleted accounts on all
        // sign-in paths. Same error as a wrong password: whether an account
        // exists — or existed — is never confirmed.
        before: async (session) => {
          if (await isUserDeleted(db, session.userId)) {
            throw new APIError('UNAUTHORIZED', {
              message: 'Invalid email or password',
              code: 'INVALID_EMAIL_OR_PASSWORD',
            })
          }
          return { data: session }
        },
      },
    },
    user: {
      create: {
        before: async (user) => {
          await assertUsernameAllowed(user.name)
          return { data: user }
        },
      },
      update: {
        before: async (user, ctx) => {
          // Updates touch many fields (emailVerified, image, …) — only a
          // rename needs the username rules.
          if (typeof user.name === 'string') {
            await assertUsernameAllowed(user.name, ctx?.context.session?.user.id)
          }
          return { data: user }
        },
      },
    },
  },
})
