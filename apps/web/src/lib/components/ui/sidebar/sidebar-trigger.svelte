<script lang="ts">
  import { cn } from '$lib/utils.js'
  import type { ComponentProps } from 'svelte'
  import { useSidebar } from './context.svelte.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import PanelLeftIcon from '@lucide/svelte/icons/panel-left'

  let {
    ref = $bindable(null),
    class: className,
    onclick,
    ...restProps
  }: ComponentProps<typeof Button> & {
    onclick?: (e: MouseEvent) => void
  } = $props()

  const sidebar = useSidebar()
</script>

<Button
  bind:ref
  type="button"
  size="icon-sm"
  variant="secondary"
  data-sidebar="trigger"
  data-slot="sidebar-trigger"
  class={cn(
    `cursor-pointer cn-sidebar-trigger fixed bottom-2 px-0! py-0! ${sidebar.isMobile ? 'border' : ''} ${sidebar.open && !sidebar.isMobile ? 'left-[268px]' : 'left-2'}`,
    className,
  )}
  onclick={(e) => {
    onclick?.(e)
    sidebar.toggle()
  }}
  {...restProps}
>
  <PanelLeftIcon />
  <span class="sr-only">Toggle Sidebar</span>
</Button>
