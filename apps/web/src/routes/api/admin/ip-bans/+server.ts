import { error, json } from '@sveltejs/kit'
import { api } from '$lib/server/api'
import type { RequestHandler } from './$types'

// The Hono ip-bans routes are internal and unauthenticated by design — this
// proxy is the enforcement point: admin role required before anything is
// forwarded.
function assertAdmin(locals: App.Locals) {
  if (!locals.session) error(401, 'Unauthorized')
  if (locals.user?.role !== 'admin') error(403, 'Forbidden')
}

export const GET: RequestHandler = async ({ locals }) => {
  assertAdmin(locals)
  const response = await api.api['ip-bans'].$get()
  return json(await response.json(), { status: response.status })
}

export const POST: RequestHandler = async ({ locals, request, getClientAddress }) => {
  assertAdmin(locals)
  const body = await request.json().catch(() => null)

  // Self-IP guard: refuse the address this admin is connecting from — it's
  // the same address the enforcement middleware would see, so banning it
  // could lock the admin out the moment their session ends.
  if (body?.ip && body.ip === getClientAddress()) {
    return json(
      {
        error: 'You cannot ban the IP address you are connecting from',
        code: 'CANNOT_BAN_OWN_IP',
        status: 400,
      },
      { status: 400 },
    )
  }

  const response = await api.api['ip-bans'].$post({ json: body })
  return json(await response.json(), { status: response.status })
}
