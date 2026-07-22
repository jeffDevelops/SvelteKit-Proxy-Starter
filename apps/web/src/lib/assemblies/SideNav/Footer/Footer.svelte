<script lang="ts">
  import Dropdown from './Dropdown.svelte'
  import type { User } from '@auth-starter/types'
  import * as Sidebar from '$lib/components/ui/sidebar/index.js'

  const { user } = $props<{ user?: User }>()
</script>

<Sidebar.Footer>
  <Sidebar.Menu>
    <Sidebar.MenuItem>
      <Dropdown {user} />
    </Sidebar.MenuItem>
  </Sidebar.Menu>
</Sidebar.Footer>
