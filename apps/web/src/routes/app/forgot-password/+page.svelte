<script lang="ts">
  import {
    validateEmail,
    RESET_LINK_SENT_MESSAGE,
    UNEXPECTED_ERROR_MESSAGE,
  } from '$lib/validation'
  import { authClient } from '$lib/auth-client'
  import * as Alert from '$lib/components/ui/alert/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import AuthShell from '$lib/components/AuthShell.svelte'
  import FormField from '$lib/components/FormField.svelte'
  import MailCheckIcon from '@lucide/svelte/icons/mail-check'
  import CircleAlertIcon from '@lucide/svelte/icons/circle-alert'
  import { ValidatedField } from '$lib/hooks/validated-field.svelte'

  const email = new ValidatedField('', validateEmail)

  let sent = $state(false)
  let submitError = $state<string | null>(null)

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault()
    email.onblur()
    if (email.invalid) return

    sent = false
    submitError = null
    const { error } = await authClient.requestPasswordReset({
      email: email.value,
      redirectTo: '/app/reset-password',
    })

    // Only infrastructure failures surface as errors. Anything else — including
    // a hypothetical account-not-found leak — gets the identical sent message
    // so this page can never confirm an account exists.
    if (error && (error.status ?? 0) >= 500) {
      submitError = UNEXPECTED_ERROR_MESSAGE
      return
    }
    sent = true
  }
</script>

<AuthShell title="Forgot Password">
  <p class="text-body text-muted-foreground text-center">
    Enter your account’s email address and we’ll send you a link to reset your
    password.
  </p>

  <form class="flex flex-col gap-4" novalidate onsubmit={handleSubmit}>
    {#if submitError}
      <Alert.Root variant="destructive">
        <CircleAlertIcon />
        <Alert.Title>Unable to send reset link</Alert.Title>
        <Alert.Description>{submitError}</Alert.Description>
      </Alert.Root>
    {/if}

    {#if sent}
      <Alert.Root role="status">
        <MailCheckIcon />
        <Alert.Title>Check your email</Alert.Title>
        <Alert.Description>{RESET_LINK_SENT_MESSAGE}</Alert.Description>
      </Alert.Root>
    {/if}

    <FormField
      id="email"
      label="Email"
      field={email}
      type="email"
      required
      autocomplete="email"
    />

    <Button type="submit">Send reset link</Button>
  </form>

  <p class="text-caption text-center">
    Remembered your password?
    <a class="text-foreground underline underline-offset-4" href="/app/sign-in"
      >Sign In</a
    >
  </p>
</AuthShell>
