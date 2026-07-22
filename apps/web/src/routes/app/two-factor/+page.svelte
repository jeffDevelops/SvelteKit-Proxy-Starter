<script lang="ts">
  import { twoFactorVerifyErrorMessage } from '$lib/validation'
  import { goto } from '$app/navigation'
  import { authClient } from '$lib/auth-client'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import AuthShell from '$lib/components/AuthShell.svelte'
  import StatusAlerts from '$lib/components/StatusAlerts.svelte'

  // Reached mid-sign-in: the password (or passkey) succeeded and Better
  // Auth set a short-lived two-factor cookie that authorizes exactly one
  // verification attempt flow — there is no session yet.
  let useBackupCode = $state(false)
  let code = $state('')
  let submitError = $state<string | null>(null)

  function switchMode() {
    useBackupCode = !useBackupCode
    code = ''
    submitError = null
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault()
    const trimmed = code.trim()
    if (!trimmed) return

    submitError = null
    const { error } = useBackupCode
      ? await authClient.twoFactor.verifyBackupCode({ code: trimmed })
      : await authClient.twoFactor.verifyTotp({ code: trimmed })

    submitError = twoFactorVerifyErrorMessage(error)
    if (!error) await goto('/app', { invalidateAll: true })
  }
</script>

<AuthShell title="Two-Factor Verification">
  <p class="text-body text-muted-foreground text-center">
    {useBackupCode
      ? 'Enter one of your backup codes. Each code works once.'
      : 'Enter the 6-digit code from your authenticator app.'}
  </p>

  <form class="flex flex-col gap-4" novalidate onsubmit={handleSubmit}>
    <StatusAlerts error={submitError} errorTitle="Unable to verify" />

    <div class="flex flex-col gap-1.5">
      {#if useBackupCode}
        <label class="text-body" for="backup-code">Backup code</label>
        <Input
          id="backup-code"
          type="text"
          required
          autocomplete="off"
          bind:value={code}
        />
      {:else}
        <label class="text-body" for="totp-code">Verification code</label>
        <Input
          id="totp-code"
          type="text"
          required
          inputmode="numeric"
          autocomplete="one-time-code"
          bind:value={code}
        />
      {/if}
    </div>

    <Button type="submit">Verify</Button>
  </form>

  <Button type="button" variant="ghost" onclick={switchMode}>
    {useBackupCode
      ? 'Use your authenticator app instead'
      : 'Use a backup code instead'}
  </Button>

  <p class="text-caption text-center">
    <a class="text-foreground underline underline-offset-4" href="/app/sign-in"
      >Back to sign in</a
    >
  </p>
</AuthShell>
