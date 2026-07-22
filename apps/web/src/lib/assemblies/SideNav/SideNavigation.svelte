<script lang="ts">
  import type { Snippet } from 'svelte'
  import Footer from './Footer/Footer.svelte'
  import type { User } from '@auth-starter/types'
  import * as Sidebar from '$lib/components/ui/sidebar/index.js'

  const { children, user }: { children?: Snippet; user?: User } = $props()
</script>

<Sidebar.Provider>
  <Sidebar.Root>
    <Sidebar.Header />
    <Sidebar.Content />
    <Footer {user} />
  </Sidebar.Root>
  <Sidebar.Inset>
    <Sidebar.Trigger />
    {@render children?.()}
  </Sidebar.Inset>
</Sidebar.Provider>
