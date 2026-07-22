import { createDb } from '@auth-starter/db'
import { env } from './env'

// One pool for the whole API process (auth, ip-bans, future routes).
export const db = createDb(env.DATABASE_URL)
