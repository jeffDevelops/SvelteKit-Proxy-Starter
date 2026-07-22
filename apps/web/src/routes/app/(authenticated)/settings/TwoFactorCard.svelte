<script lang="ts">
  import {
    twoFactorPasswordErrorMessage,
    twoFactorVerifyErrorMessage,
    validateSignInPassword,
    TWO_FACTOR_DISABLED_MESSAGE,
    TWO_FACTOR_ENABLED_MESSAGE,
  } from '$lib/validation'
  import { renderSVG } from 'uqr'
  import { authClient } from '$lib/auth-client'
  import { invalidateAll } from '$app/navigation'
  import * as Card from '$lib/components/ui/card/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import FormField from '$lib/components/FormField.svelte'
  import StatusAlerts from '$lib/components/StatusAlerts.svelte'
  import { ValidatedField } from '$lib/hooks/validated-field.svelte'

  interface Props {
    /** From session data — refreshed via invalidateAll after enable/disable. */
    enabled: boolean
  }

  let { enabled }: Props = $props()

  const password = new ValidatedField('', validateSignInPassword)

  let enrollment = $state<{ totpURI: string; backupCodes: string[] } | null>(
    null,
  )
  let code = $state('')
  let status = $state<string | null>(null)
  let error = $state<string | null>(null)

  const qr = $derived(enrollment ? renderSVG(enrollment.totpURI) : null)
  // Manual-entry fallback for password managers and devices with no camera
  const secret = $derived(
    enrollment ? new URL(enrollment.totpURI).searchParams.get('secret') : null,
  )

  async function startEnrollment(event: SubmitEvent) {
    event.preventDefault()
    password.onblur()
    if (password.invalid) return

    status = null
    error = null
    const { data: enrollData, error: apiError } =
      await authClient.twoFactor.enable({
        password: password.value,
      })

    error = twoFactorPasswordErrorMessage(apiError)
    if (apiError || !enrollData) return
    // Not enabled yet — the account flips only after a code verifies, so a
    // typo'd authenticator setup can't lock the user out.
    enrollment = enrollData
    password.reset()
  }

  async function confirmCode(event: SubmitEvent) {
    event.preventDefault()
    const trimmed = code.trim()
    if (!trimmed) return

    status = null
    error = null
    const { error: apiError } = await authClient.twoFactor.verifyTotp({
      code: trimmed,
    })

    error = twoFactorVerifyErrorMessage(apiError)
    if (apiError) return
    status = TWO_FACTOR_ENABLED_MESSAGE
    enrollment = null
    code = ''
    await invalidateAll()
  }

  async function disable(event: SubmitEvent) {
    event.preventDefault()
    password.onblur()
    if (password.invalid) return

    status = null
    error = null
    const { error: apiError } = await authClient.twoFactor.disable({
      password: password.value,
    })

    error = twoFactorPasswordErrorMessage(apiError)
    if (apiError) return
    status = TWO_FACTOR_DISABLED_MESSAGE
    password.reset()
    await invalidateAll()
  }
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>Two-factor authentication</Card.Title>
    <Card.Description>
      Add a second step at sign-in: a rotating code from an authenticator app.
      Recommended for every account, and especially any account that receives
      payouts.
    </Card.Description>
  </Card.Header>
  <Card.Content class="flex flex-col gap-4 pt-4">
    <StatusAlerts {error} {status} />

    {#if enrollment}
      <p class="text-body">
        Scan the QR code with your authenticator app, then enter the 6-digit
        code it shows to finish turning on two-factor.
      </p>
      <!-- The SVG carries its own light background so it stays scannable
           in dark mode -->
      <div
        class="w-40 overflow-hidden rounded-md border"
        role="img"
        aria-label="Two-factor QR code"
      >
        {@html qr}
      </div>
      <p class="text-caption text-muted-foreground">
        Can’t scan? Enter this key manually:
        <code class="text-foreground font-mono" data-testid="totp-secret"
          >{secret}</code
        >
      </p>
      <div class="flex flex-col gap-1.5">
        <p class="text-body">
          Backup codes — each signs you in once if you lose your device. Save
          them now; they won’t be shown again:
        </p>
        <ul
          class="text-caption text-muted-foreground grid grid-cols-2 gap-1 font-mono"
        >
          {#each enrollment.backupCodes as backupCode (backupCode)}
            <li>{backupCode}</li>
          {/each}
        </ul>
      </div>
      <form class="flex flex-col gap-4" novalidate onsubmit={confirmCode}>
        <div class="flex flex-col gap-1.5">
          <label class="text-body" for="two-factor-code">
            Verification code
          </label>
          <Input
            id="two-factor-code"
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            bind:value={code}
          />
        </div>
        <Button type="submit" class="self-start">Confirm code</Button>
      </form>
    {:else}
      <form
        class="flex flex-col gap-4 mt-[-24px]"
        novalidate
        onsubmit={enabled ? disable : startEnrollment}
      >
        <FormField
          id="two-factor-password"
          label="Account password"
          field={password}
          type="password"
          required
          autocomplete="current-password"
        />
        <Button
          type="submit"
          variant={enabled ? 'destructive' : 'default'}
          class="self-start"
        >
          {enabled ? 'Disable two-factor' : 'Enable two-factor'}
        </Button>
      </form>
    {/if}
  </Card.Content>
</Card.Root>
