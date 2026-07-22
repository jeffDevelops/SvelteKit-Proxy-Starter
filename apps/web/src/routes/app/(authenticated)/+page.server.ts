import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.session) return redirect(303, '/app/sign-in')

  return {
    user: locals.user,
    session: locals.session,
  }
}
