import { cors } from 'hono/cors'

if (!process.env.CLIENT_HOST)
  throw new Error('CLIENT_HOST environment variable must be present for CORS configuration')

const corsConfig = {
  credentials: true,
  origin: process.env.CLIENT_HOST,
  allowMethods: ['POST', 'GET', 'OPTIONS'],
}

export const corsMiddleware = cors(corsConfig)
