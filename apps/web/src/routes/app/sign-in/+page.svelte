<script lang="ts">
  import {
    passkeySignInErrorMessage,
    signInErrorMessage,
    validateEmail,
    validateSignInPassword,
  } from '$lib/validation'
  import { goto } from '$app/navigation'
  import { authClient } from '$lib/auth-client'
  import { Button } from '$lib/components/ui/button/index.js'
  import AuthShell from '$lib/components/AuthShell.svelte'
  import FormField from '$lib/components/FormField.svelte'
  import StatusAlerts from '$lib/components/StatusAlerts.svelte'
  import { ValidatedField } from '$lib/hooks/validated-field.svelte'
  import FingerprintIcon from '@lucide/svelte/icons/fingerprint'

  const email = new ValidatedField('', validateEmail)
  const password = new ValidatedField('', validateSignInPassword)
  const fields = [email, password]

  let submitError = $state<string | null>(null)

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault()
    for (const field of fields) field.onblur()
    if (fields.some((field) => field.invalid)) return

    submitError = null
    const { data, error } = await authClient.signIn.email({
      email: email.value,
      password: password.value,
    })

    submitError = signInErrorMessage(error)
    if (error) return

    // Accounts with 2FA get a challenge instead of a session — the password
    // alone must never complete a sign-in for them.
    if (data && 'twoFactorRedirect' in data && data.twoFactorRedirect) {
      await goto('/app/two-factor')
      return
    }
    await goto('/app', { invalidateAll: true })
  }

  // Deliberately skips the form validators — the browser resolves which
  // account to use, so email/password stay untouched.
  async function signInWithPasskey() {
    submitError = null
    const result = await authClient.signIn.passkey()
    const error = result?.error ?? null

    submitError = passkeySignInErrorMessage(error)
    if (!error) await goto('/app', { invalidateAll: true })
  }
</script>

<AuthShell title="Sign In">
  <form class="flex flex-col gap-4" novalidate onsubmit={handleSubmit}>
    <StatusAlerts error={submitError} errorTitle="Unable to sign in" />

    <FormField
      id="email"
      label="Email"
      field={email}
      type="email"
      required
      autocomplete="email"
    />

    <FormField
      id="password"
      label="Password"
      field={password}
      type="password"
      required
      autocomplete="current-password"
    >
      {#snippet labelAccessory()}
        <a
          class="text-caption text-muted-foreground underline underline-offset-4"
          href="/app/forgot-password">Forgot password?</a
        >
      {/snippet}
    </FormField>

    <Button type="submit">Sign In</Button>
  </form>

  <div class="flex items-center gap-3">
    <div class="bg-border h-px flex-1"></div>
    <span class="text-caption text-muted-foreground">or</span>
    <div class="bg-border h-px flex-1"></div>
  </div>

  <Button type="button" variant="outline" onclick={signInWithPasskey}>
    <FingerprintIcon />
    Sign in with a passkey
  </Button>

  <p class="text-caption text-center">
    Don’t have an account?
    <a class="text-foreground underline underline-offset-4" href="/app/sign-up"
      >Sign Up</a
    >
  </p>
</AuthShell>
