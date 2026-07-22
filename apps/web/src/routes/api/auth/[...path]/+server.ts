import type { RequestHandler } from '@sveltejs/kit'
import { API_HOST } from '$env/static/private'

const proxy: RequestHandler = async ({ request, params, url: requestUrl, getClientAddress }) => {
  // Keep the query string — verification/reset links arrive as GETs carrying
  // ?token=...&callbackURL=...
  const url = `http://${API_HOST}/api/auth/${params.path}${requestUrl.search}`

  // The API rate-limits per IP keyed on x-forwarded-for, so it must carry the
  // connection address this server observed — never a header the client sent.
  const headers = new Headers(request.headers)
  headers.set('x-forwarded-for', getClientAddress())

  // redirect: 'manual' — Better Auth answers verify-email/reset links with a
  // 302 to its callbackURL; the browser must receive that redirect, not the
  // page this server-side fetch would land on by following it.
  return fetch(url, {
    method: request.method,
    headers,
    redirect: 'manual',
    body:
      request.method !== 'GET' && request.method !== 'HEAD'
        ? await request.arrayBuffer()
        : undefined,
  })
}

export const GET = proxy
export const POST = proxy
