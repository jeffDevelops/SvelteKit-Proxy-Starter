import { createAuthClient } from 'better-auth/svelte'
import { adminClient, twoFactorClient } from 'better-auth/client/plugins'
import { passkeyClient } from '@better-auth/passkey/client'
import { goto } from '$app/navigation'
import { PUBLIC_CLIENT_HOST } from '$env/static/public'

export const authClient = createAuthClient({
  baseURL: `${PUBLIC_CLIENT_HOST}/api/auth`,
  // No twoFactorPage/onTwoFactorRedirect here: sign-in flows check
  // `data.twoFactorRedirect` themselves and route with SvelteKit's goto.
  plugins: [passkeyClient(), twoFactorClient(), adminClient()],
  sessionOptions: {
    refetchInterval: 60,
    refetchWhenOffline: false,
    refetchOnWindowFocus: true,
  },
})

export const signOut = async () => {
  await authClient.signOut({
    fetchOptions: {
      onSuccess: () => goto('/app/sign-in', { invalidateAll: true }),
    },
  })
}
