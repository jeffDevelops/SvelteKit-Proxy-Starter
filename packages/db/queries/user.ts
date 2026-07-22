import { eq, sql } from 'drizzle-orm'
import { session, user } from '../schema'
import type { createDb } from '../createDb'

type Db = ReturnType<typeof createDb>

/**
 * Case-insensitive check backed by the `user_name_lower_unique_idx` unique
 * index. Pass `excludeUserId` when validating a rename so the user's own row
 * doesn't count as a collision (e.g. changing only capitalization).
 */
export const isUsernameTaken = async (
  db: Db,
  name: string,
  excludeUserId?: string,
): Promise<boolean> => {
  const collision = sql`lower(${user.name}) = lower(${name})`

  const rows = await db
    .select({ id: user.id })
    .from(user)
    .where(excludeUserId ? sql`${collision} and ${user.id} <> ${excludeUserId}` : collision)
    .limit(1)

  return rows.length > 0
}

/**
 * Soft delete per the repo convention — the row stays (compliance value),
 * sign-in is blocked by the API's session-create hook while `deletedAt` is
 * set. Restoration is a support action: clear the column.
 */
export const softDeleteUser = async (db: Db, userId: string): Promise<void> => {
  await db.update(user).set({ deletedAt: new Date() }).where(eq(user.id, userId))
}

export const isUserDeleted = async (db: Db, userId: string): Promise<boolean> => {
  const rows = await db
    .select({ deletedAt: user.deletedAt })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)

  return Boolean(rows[0]?.deletedAt)
}

/** Revokes every session server-side (rows, not cookies). */
export const deleteUserSessions = async (db: Db, userId: string): Promise<void> => {
  await db.delete(session).where(eq(session.userId, userId))
}

/**
 * Assigns a Better Auth admin-plugin role by email. The first admin can't
 * be minted through the UI (only admins may set roles), so bootstrap via
 * `bun run make-admin -- <email>` in packages/db. Returns false when no
 * account matches.
 */
export const setUserRole = async (db: Db, email: string, role: string): Promise<boolean> => {
  const rows = await db
    .update(user)
    .set({ role })
    .where(sql`lower(${user.email}) = lower(${email})`)
    .returning({ id: user.id })

  return rows.length > 0
}
