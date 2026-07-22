import { listActiveBannedIps } from '@auth-starter/db'
import { db } from './db'
import { createIpBanChecker } from './ip-ban-cache'

// Process-wide checker used by the auth middleware; the ip-bans routes
// invalidate it on every mutation so changes apply immediately.
export const ipBans = createIpBanChecker(() => listActiveBannedIps(db))
