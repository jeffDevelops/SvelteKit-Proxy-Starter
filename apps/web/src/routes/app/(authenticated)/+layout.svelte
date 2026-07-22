<script lang="ts">
  import type { User } from '@auth-starter/types'
  import SideNav from '$lib/assemblies/SideNav/SideNavigation.svelte'
  import VerifyEmailBanner from '$lib/components/VerifyEmailBanner.svelte'

  const { children, data } = $props<{
    children: () => void
    data: { user: User | null }
  }>()
</script>

<SideNav user={data.user}>
  {#if data.user && !data.user.emailVerified}
    <VerifyEmailBanner email={data.user.email} />
  {/if}
  {@render children?.()}
</SideNav>
