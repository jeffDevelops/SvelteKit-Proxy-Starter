<script lang="ts">
  import type { User } from '@auth-starter/types'
  import { EllipsisVertical } from '@lucide/svelte'
  import { authClient, signOut } from '$lib/auth-client'
  import * as Sidebar from '$lib/components/ui/sidebar/index.js'
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js'

  const { user } = $props<{ user?: User }>()
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <Sidebar.MenuButton
        {...props}
        class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
      >
        {user?.name}
        <EllipsisVertical class="ms-auto" />
      </Sidebar.MenuButton>
    {/snippet}
  </DropdownMenu.Trigger>
  <DropdownMenu.Content
    side="top"
    portalProps={{ disabled: true }}
    class="w-(--bits-dropdown-menu-anchor-width)"
  >
    <DropdownMenu.Item>
      {#snippet child({ props })}
        <a href="/app/settings" {...props}>
          <span>Settings</span>
        </a>
      {/snippet}
    </DropdownMenu.Item>
    {#if user?.role === 'admin'}
      <DropdownMenu.Item>
        {#snippet child({ props })}
          <a href="/app/admin" {...props}>
            <span>Admin</span>
          </a>
        {/snippet}
      </DropdownMenu.Item>
    {/if}
    <DropdownMenu.Item onclick={signOut}>
      <span>Sign Out</span>
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
