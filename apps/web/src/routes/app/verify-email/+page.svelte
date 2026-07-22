<script lang="ts">
  import { page } from '$app/state'
  import * as Alert from '$lib/components/ui/alert/index.js'
  import ThemeToggle from '$lib/components/ThemeToggle.svelte'
  import CircleCheckIcon from '@lucide/svelte/icons/circle-check'
  import CircleAlertIcon from '@lucide/svelte/icons/circle-alert'
  import AppLogo from '$lib/components/svg/AppLogo.svelte'

  // Better Auth lands here after the emailed link: clean on success,
  // ?error=INVALID_TOKEN / TOKEN_EXPIRED when the link is bad.
  const failed = page.url.searchParams.get('error') !== null
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

    <h1 class="text-heading text-center">Email Confirmation</h1>

    {#if failed}
      <Alert.Root variant="destructive">
        <CircleAlertIcon />
        <Alert.Title>Link expired</Alert.Title>
        <Alert.Description>
          This confirmation link is invalid or has expired. Sign in and use the
          “Resend email” button to get a fresh one.
        </Alert.Description>
      </Alert.Root>

      <p class="text-caption text-center">
        <a
          class="text-foreground underline underline-offset-4"
          href="/app/sign-in">Sign In</a
        >
      </p>
    {:else}
      <Alert.Root role="status">
        <CircleCheckIcon />
        <Alert.Title>Email confirmed</Alert.Title>
        <Alert.Description>
          Thanks — your email address is verified.
        </Alert.Description>
      </Alert.Root>

      <p class="text-caption text-center">
        <a class="text-foreground underline underline-offset-4" href="/app"
          >Continue to auth-starter</a
        >
      </p>
    {/if}
  </div>

  <div class="absolute bottom-4 left-4">
    <ThemeToggle />
  </div>
</section>
