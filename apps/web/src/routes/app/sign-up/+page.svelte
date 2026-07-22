<script lang="ts">
  import {
    validateEmail,
    validatePassword,
    validateUsername,
    signUpErrorMessage,
  } from '$lib/validation'
  import { goto } from '$app/navigation'
  import { authClient } from '$lib/auth-client'
  import { Button } from '$lib/components/ui/button/index.js'
  import AuthShell from '$lib/components/AuthShell.svelte'
  import FormField from '$lib/components/FormField.svelte'
  import StatusAlerts from '$lib/components/StatusAlerts.svelte'
  import { ValidatedField } from '$lib/hooks/validated-field.svelte'

  const username = new ValidatedField('', validateUsername)
  const email = new ValidatedField('', validateEmail)
  const password = new ValidatedField('', validatePassword)
  const fields = [username, email, password]

  let submitError = $state<string | null>(null)

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault()
    for (const field of fields) field.onblur()
    if (fields.some((field) => field.invalid)) return

    submitError = null
    const { error } = await authClient.signUp.email({
      email: email.value,
      password: password.value,
      name: username.value,
      // Where the emailed confirmation link lands after Better Auth verifies it
      callbackURL: '/app/verify-email',
    })

    submitError = signUpErrorMessage(error)
    if (!error) await goto('/app', { invalidateAll: true })
  }
</script>

<AuthShell title="Sign Up">
  <form class="flex flex-col gap-4" novalidate onsubmit={handleSubmit}>
    <StatusAlerts error={submitError} errorTitle="Unable to sign up" />

    <FormField
      id="username"
      label="Username"
      field={username}
      type="text"
      pattern="[a-zA-Z0-9_]+"
      required
      autocomplete="username"
    />

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
      minlength={8}
      autocomplete="new-password"
    />

    <Button type="submit">Sign Up</Button>
  </form>

  <p class="text-caption text-center">
    Already have an account?
    <a class="text-foreground underline underline-offset-4" href="/app/sign-in"
      >Sign In</a
    >
  </p>
</AuthShell>
