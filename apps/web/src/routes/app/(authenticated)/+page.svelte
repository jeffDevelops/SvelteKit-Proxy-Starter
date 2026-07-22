<script lang="ts">
  import type { PageProps } from './$types'
  const { data }: PageProps = $props()
</script>

<div>
  Welcome, {data?.user?.name}
</div>
