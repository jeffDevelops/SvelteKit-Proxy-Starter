import { Hono } from 'hono'
import { auth, env } from './utils'
import { logger } from './utils/logger'
import { serve } from '@hono/node-server'
import { corsMiddleware } from './middleware'
import { ipBanMiddleware } from './middleware/ip-ban'
import { ipBansRoute } from './routes/ip-bans'

// Method-chained so `ApiType` carries every route for the typed RPC client
// (hono/client) the web app uses per the networking conventions.
const app = new Hono()
  .get('/health', (c) => c.text('Healthy'))
  .use(corsMiddleware)
  .use('/api/auth/*', ipBanMiddleware)
  .on(['POST', 'GET'], '/api/auth/*', ({ req }) => auth.handler(req.raw))
  .route('/api/ip-bans', ipBansRoute)

// Full detail stays server-side; clients get the standard envelope with a
// generic message (never a stack trace or internal error text).
app.onError((error, c) => {
  logger.error('unhandled error', {
    path: c.req.path,
    method: c.req.method,
    error: error.message,
    stack: error.stack,
  })
  return c.json({ error: 'Something went wrong', code: 'INTERNAL_ERROR', status: 500 }, 500)
})

export type ApiType = typeof app

serve({
  fetch: app.fetch,
  port: env.PORT ?? 3000,
})

logger.info('api listening', { port: env.PORT ?? 3000 })
