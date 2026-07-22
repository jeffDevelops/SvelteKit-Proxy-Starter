<script lang="ts">
  import {
    validatePassword,
    resetPasswordErrorMessage,
    PASSWORD_RESET_SUCCESS_MESSAGE,
    RESET_LINK_INVALID_MESSAGE,
  } from '$lib/validation'
  import { page } from '$app/state'
  import { authClient } from '$lib/auth-client'
  import * as Alert from '$lib/components/ui/alert/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import AuthShell from '$lib/components/AuthShell.svelte'
  import FormField from '$lib/components/FormField.svelte'
  import StatusAlerts from '$lib/components/StatusAlerts.svelte'
  import CircleCheckIcon from '@lucide/svelte/icons/circle-check'
  import CircleAlertIcon from '@lucide/svelte/icons/circle-alert'
  import { ValidatedField } from '$lib/hooks/validated-field.svelte'

  const password = new ValidatedField('', validatePassword)

  // Better Auth redirects here with ?token= from a valid link, or ?error=
  // when the link is bad/expired. No token at all means someone typed the URL.
  const token = page.url.searchParams.get('token')
  const linkInvalid = !token || page.url.searchParams.get('error') !== null

  let succeeded = $state(false)
  let submitError = $state<string | null>(null)

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault()
    password.onblur()
    if (password.invalid || !token) return

    submitError = null
    const { error } = await authClient.resetPassword({
      newPassword: password.value,
      token,
    })

    submitError = resetPasswordErrorMessage(error)
    if (!error) succeeded = true
  }
</script>

<AuthShell title="Reset Password">
  {#if linkInvalid}
    <Alert.Root variant="destructive">
      <CircleAlertIcon />
      <Alert.Title>Link expired</Alert.Title>
      <Alert.Description>{RESET_LINK_INVALID_MESSAGE}</Alert.Description>
    </Alert.Root>

    <p class="text-caption text-center">
      <a
        class="text-foreground underline underline-offset-4"
        href="/app/forgot-password">Request a new link</a
      >
    </p>
  {:else if succeeded}
    <Alert.Root role="status">
      <CircleCheckIcon />
      <Alert.Title>Password reset</Alert.Title>
      <Alert.Description>{PASSWORD_RESET_SUCCESS_MESSAGE}</Alert.Description>
    </Alert.Root>
  {:else}
    <form class="flex flex-col gap-4" novalidate onsubmit={handleSubmit}>
      <StatusAlerts error={submitError} errorTitle="Unable to reset password" />

      <FormField
        id="new-password"
        label="New password"
        field={password}
        type="password"
        required
        minlength={8}
        autocomplete="new-password"
      />

      <Button type="submit">Reset password</Button>
    </form>
  {/if}

  <p class="text-caption text-center">
    Back to
    <a class="text-foreground underline underline-offset-4" href="/app/sign-in"
      >Sign In</a
    >
  </p>
</AuthShell>
