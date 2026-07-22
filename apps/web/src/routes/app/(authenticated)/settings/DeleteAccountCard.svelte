<script lang="ts">
  import {
    deleteAccountErrorMessage,
    validateSignInPassword,
    DELETE_ACCOUNT_EMAIL_SENT_MESSAGE,
  } from '$lib/validation'
  import { ACCOUNT_DELETED_PATH } from '@auth-starter/validation'
  import { authClient } from '$lib/auth-client'
  import * as Card from '$lib/components/ui/card/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import FormField from '$lib/components/FormField.svelte'
  import StatusAlerts from '$lib/components/StatusAlerts.svelte'
  import { ValidatedField } from '$lib/hooks/validated-field.svelte'

  const password = new ValidatedField('', validateSignInPassword)

  let status = $state<string | null>(null)
  let error = $state<string | null>(null)

  async function requestDeletion(event: SubmitEvent) {
    event.preventDefault()
    password.onblur()
    if (password.invalid) return

    status = null
    error = null
    // Nothing is deleted yet — the API emails a confirmation link, and only
    // the click soft-deletes the account and signs out every device.
    const { error: apiError } = await authClient.deleteUser({
      password: password.value,
      callbackURL: ACCOUNT_DELETED_PATH,
    })

    error = deleteAccountErrorMessage(apiError)
    if (apiError) return
    status = DELETE_ACCOUNT_EMAIL_SENT_MESSAGE
    password.reset()
  }
</script>

<Card.Root>
  <form novalidate onsubmit={requestDeletion}>
    <Card.Header>
      <Card.Title>Delete account</Card.Title>
      <Card.Description>
        Signs you out everywhere and closes your account. We’ll email you a
        confirmation link first — nothing is deleted until you click it.
      </Card.Description>
    </Card.Header>
    <Card.Content class="flex flex-col gap-4 pt-4">
      <StatusAlerts {error} {status} />

      <FormField
        id="delete-password"
        label="Confirm your password"
        field={password}
        type="password"
        required
        autocomplete="current-password"
      />
    </Card.Content>
    <Card.Footer class="pt-4">
      <Button type="submit" variant="destructive">Delete account</Button>
    </Card.Footer>
  </form>
</Card.Root>
