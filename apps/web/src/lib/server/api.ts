import { hc } from 'hono/client'
import { API_HOST } from '$env/static/private'
import type { ApiType } from '@auth-starter/api'

// Typed RPC client for SvelteKit → Hono calls (networking convention: the
// Hono route definitions are the source of truth for API types). Server-only:
// the API is internal and never reachable from the browser.
export const api = hc<ApiType>(`http://${API_HOST}`)
