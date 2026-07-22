import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

// Role-gated: the API enforces admin on every /admin/* endpoint too — this
// guard just keeps non-admins from ever seeing the page shell.
export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.session) return redirect(303, '/app/sign-in')
  if (locals.user?.role !== 'admin') return redirect(303, '/app')

  return {
    user: locals.user,
    session: locals.session,
  }
}
