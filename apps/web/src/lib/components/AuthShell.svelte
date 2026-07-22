<script lang="ts">
  import type { Snippet } from 'svelte'
  import AppLogo from '$lib/components/svg/AppLogo.svelte'
  import ThemeToggle from '$lib/components/ThemeToggle.svelte'

  // Full-screen shell shared by every unauthenticated flow page (sign-in,
  // sign-up, password reset, 2FA challenge, …): centered column, logo,
  // heading, theme toggle pinned bottom-left.
  interface Props {
    title: string
    children: Snippet
  }

  let { title, children }: Props = $props()
</script>

<section
  class="bg-background fixed top-0 left-0 z-99 h-full w-full overflow-y-auto"
>
  <div
    class="mx-auto flex min-h-full w-full max-w-sm flex-col md:justify-center max-sm:mt-[10vh] gap-6 px-4 py-8"
  >
    <div class="mx-auto size-24 md:size-32 mb-6">
      <AppLogo />
    </div>

    <h1 class="text-heading text-center">{title}</h1>

    {@render children()}
  </div>

  <div class="absolute bottom-4 left-4">
    <ThemeToggle />
  </div>
</section>
