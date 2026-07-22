import { type Handle } from '@sveltejs/kit'
import { API_HOST } from '$env/static/private'

export const handle: Handle = async ({ event, resolve }) => {
  let session = null

  try {
    const res = await fetch(`http://${API_HOST}/api/auth/get-session`, {
      headers: {
        cookie: event.request.headers.get('cookie') ?? '',
      },
    })
    session = res.ok ? await res.json() : null
  } catch {
    // API unreachable — serve the page signed out rather than failing
  }

  event.locals.session = session?.session ?? null
  event.locals.user = session?.user ?? null

  return resolve(event)
}
