<script lang="ts">
  import {
    changePasswordErrorMessage,
    validatePassword,
    validateSignInPassword,
    PASSWORD_CHANGED_MESSAGE,
  } from '$lib/validation'
  import { authClient } from '$lib/auth-client'
  import * as Card from '$lib/components/ui/card/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import FormField from '$lib/components/FormField.svelte'
  import StatusAlerts from '$lib/components/StatusAlerts.svelte'
  import { ValidatedField } from '$lib/hooks/validated-field.svelte'

  const currentPassword = new ValidatedField('', validateSignInPassword)
  const newPassword = new ValidatedField('', validatePassword)

  let status = $state<string | null>(null)
  let error = $state<string | null>(null)

  async function changePassword(event: SubmitEvent) {
    event.preventDefault()
    currentPassword.onblur()
    newPassword.onblur()
    if (currentPassword.invalid || newPassword.invalid) return

    status = null
    const { error: apiError } = await authClient.changePassword({
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
      revokeOtherSessions: true,
    })

    error = changePasswordErrorMessage(apiError)
    if (!apiError) {
      status = PASSWORD_CHANGED_MESSAGE
      currentPassword.reset()
      newPassword.reset()
    }
  }
</script>

<Card.Root>
  <form novalidate onsubmit={changePassword}>
    <Card.Header>
      <Card.Title>Password</Card.Title>
      <Card.Description>
        Changing your password signs out your other devices.
      </Card.Description>
    </Card.Header>
    <Card.Content class="flex flex-col gap-4 pt-4">
      <StatusAlerts {error} {status} />

      <FormField
        id="current-password"
        label="Current password"
        field={currentPassword}
        type="password"
        required
        autocomplete="current-password"
      />

      <FormField
        id="new-password"
        label="New password"
        field={newPassword}
        type="password"
        required
        minlength={8}
        autocomplete="new-password"
      />
    </Card.Content>
    <Card.Footer class="pt-4">
      <Button type="submit">Change password</Button>
    </Card.Footer>
  </form>
</Card.Root>
