<script lang="ts">
  import {
    updateUsernameErrorMessage,
    validateUsername,
    USERNAME_UPDATED_MESSAGE,
  } from '$lib/validation'
  import { authClient } from '$lib/auth-client'
  import { invalidateAll } from '$app/navigation'
  import * as Card from '$lib/components/ui/card/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import FormField from '$lib/components/FormField.svelte'
  import StatusAlerts from '$lib/components/StatusAlerts.svelte'
  import { ValidatedField } from '$lib/hooks/validated-field.svelte'

  interface Props {
    name: string
  }

  let { name }: Props = $props()

  // svelte-ignore state_referenced_locally — prefill wants the initial
  // value; after a rename we invalidateAll() and the page remounts.
  const username = new ValidatedField(name, validateUsername)

  let status = $state<string | null>(null)
  let error = $state<string | null>(null)

  async function saveUsername(event: SubmitEvent) {
    event.preventDefault()
    username.onblur()
    if (username.invalid) return

    status = null
    const { error: apiError } = await authClient.updateUser({
      name: username.value,
    })

    error = updateUsernameErrorMessage(apiError)
    if (!apiError) {
      status = USERNAME_UPDATED_MESSAGE
      await invalidateAll()
    }
  }
</script>

<Card.Root>
  <form novalidate onsubmit={saveUsername}>
    <Card.Header>
      <Card.Title>Username</Card.Title>
      <Card.Description>
        Your public name across the app. Changing it may confuse people
        who know you by it or break links that point to your profile.
      </Card.Description>
    </Card.Header>
    <Card.Content class="flex flex-col gap-4 pt-4">
      <StatusAlerts {error} {status} />

      <FormField
        id="username"
        label="Username"
        field={username}
        type="text"
        required
        autocomplete="username"
      />
    </Card.Content>
    <Card.Footer class="pt-4">
      <Button type="submit" variant="destructive">Change username</Button>
    </Card.Footer>
  </form>
</Card.Root>
