import { desc, eq, gt, isNull, or, sql } from 'drizzle-orm'
import { bannedIp } from '../schema'
import type { createDb } from '../createDb'

type Db = ReturnType<typeof createDb>

const active = or(isNull(bannedIp.expiresAt), gt(bannedIp.expiresAt, sql`now()`))

/** Active bans only — expired rows are ignored (and swept lazily). */
export const listIpBans = async (db: Db) => {
  return db.select().from(bannedIp).where(active).orderBy(desc(bannedIp.createdAt))
}

export const listActiveBannedIps = async (db: Db): Promise<string[]> => {
  const rows = await db.select({ ip: bannedIp.ip }).from(bannedIp).where(active)
  return rows.map((row) => row.ip)
}

export const createIpBan = async (
  db: Db,
  ban: { ip: string; reason?: string | null; expiresAt?: Date | null },
) => {
  const [row] = await db.insert(bannedIp).values(ban).returning()
  return row
}

export const deleteIpBan = async (db: Db, id: string): Promise<boolean> => {
  const rows = await db.delete(bannedIp).where(eq(bannedIp.id, id)).returning({ id: bannedIp.id })
  return rows.length > 0
}

export type IpBan = typeof bannedIp.$inferSelect
