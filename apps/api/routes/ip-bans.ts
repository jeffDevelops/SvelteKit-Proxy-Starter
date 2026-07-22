import { Hono } from 'hono'
import { z } from 'zod'
import { createIpBan, deleteIpBan, listIpBans } from '@auth-starter/db'
import { db } from '../utils/db'
import { ipBans } from '../utils/ip-bans'

// Internal-only (the API is never publicly exposed): callers are the
// SvelteKit admin endpoints, which enforce the admin role before proxying.
const CreateIpBanSchema = z.object({
  ip: z.union([z.ipv4(), z.ipv6()]),
  reason: z.string().max(500).optional(),
  expiresInDays: z.number().int().positive().max(3650).optional(),
})

export const ipBansRoute = new Hono()
  .get('/', async (c) => {
    return c.json(await listIpBans(db))
  })
  .post('/', async (c) => {
    const parsed = CreateIpBanSchema.safeParse(await c.req.json().catch(() => null))
    if (!parsed.success) {
      return c.json({ error: 'Invalid IP ban', code: 'INVALID_IP_BAN', status: 400 }, 400)
    }

    const { ip, reason, expiresInDays } = parsed.data
    const ban = await createIpBan(db, {
      ip,
      reason: reason ?? null,
      expiresAt: expiresInDays ? new Date(Date.now() + expiresInDays * 86_400_000) : null,
    })
    ipBans.invalidate()
    return c.json(ban, 201)
  })
  .delete('/:id', async (c) => {
    const id = z.uuid().safeParse(c.req.param('id'))
    if (!id.success || !(await deleteIpBan(db, id.data))) {
      return c.json({ error: 'Not found', code: 'NOT_FOUND', status: 404 }, 404)
    }
    ipBans.invalidate()
    return c.json({ success: true })
  })
