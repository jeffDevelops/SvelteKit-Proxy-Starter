import type { Context, Next } from 'hono'
import { ipBans } from '../utils/ip-bans'

// Applied to the auth paths only: that's where x-forwarded-for is
// trustworthy (the SvelteKit proxy overwrites it with the connection
// address it observed) and where a banned address can actually do harm.
// Site-wide edge blocking is a Cloudflare concern, not the API's.
export async function ipBanMiddleware(c: Context, next: Next) {
  const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
  if (ip && (await ipBans.isBanned(ip))) {
    return c.json(
      { error: 'Access from your network is restricted', code: 'IP_BANNED', status: 403 },
      403,
    )
  }
  return next()
}
