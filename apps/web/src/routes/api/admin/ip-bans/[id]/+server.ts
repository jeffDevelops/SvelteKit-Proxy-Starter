import { error, json } from '@sveltejs/kit'
import { api } from '$lib/server/api'
import type { RequestHandler } from './$types'

export const DELETE: RequestHandler = async ({ locals, params }) => {
  if (!locals.session) error(401, 'Unauthorized')
  if (locals.user?.role !== 'admin') error(403, 'Forbidden')

  const response = await api.api['ip-bans'][':id'].$delete({ param: { id: params.id } })
  return json(await response.json(), { status: response.status })
}
