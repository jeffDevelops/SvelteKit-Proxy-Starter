<script lang="ts">
  import MonitorIcon from '@lucide/svelte/icons/monitor'
  import MoonIcon from '@lucide/svelte/icons/moon'
  import SunIcon from '@lucide/svelte/icons/sun'
  import { Button } from '$lib/components/ui/button/index.js'
  import { theme, type ThemePreference } from '$lib/hooks/theme.svelte'

  const options: {
    value: ThemePreference
    label: string
    icon: typeof SunIcon
  }[] = [
    { value: 'dark', label: 'Dark Theme', icon: MoonIcon },
    { value: 'light', label: 'Light Theme', icon: SunIcon },
    { value: 'system', label: 'System Theme', icon: MonitorIcon },
  ]
</script>

<div
  role="group"
  aria-label="Theme"
  class="bg-background flex items-center gap-1 rounded-md border p-1"
>
  {#each options as option (option.value)}
    <Button
      size="icon"
      title={option.label}
      aria-label={option.label}
      class="hover:bg-secondary!"
      onclick={() => theme.set(option.value)}
      aria-pressed={theme.preference === option.value}
      variant={theme.preference === option.value ? 'secondary' : 'ghost'}
    >
      <option.icon />
    </Button>
  {/each}
</div>
