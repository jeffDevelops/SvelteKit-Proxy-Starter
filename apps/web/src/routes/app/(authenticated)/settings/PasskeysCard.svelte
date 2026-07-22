<script lang="ts">
  import {
    addPasskeyErrorMessage,
    PASSKEY_ADDED_MESSAGE,
    PASSKEY_REMOVED_MESSAGE,
    UNEXPECTED_ERROR_MESSAGE,
  } from '$lib/validation'
  import { onMount } from 'svelte'
  import { authClient } from '$lib/auth-client'
  import * as Card from '$lib/components/ui/card/index.js'
  import * as Alert from '$lib/components/ui/alert/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import StatusAlerts from '$lib/components/StatusAlerts.svelte'
  import SquareDashedIcon from '@lucide/svelte/icons/square-dashed'

  // The API's canonical shape has more fields (credential, counter, …) —
  // the card only renders these.
  type StoredPasskey = {
    id: string
    name?: string | null
    createdAt: string | Date
  }

  let passkeys = $state<StoredPasskey[]>([])
  let passkeyName = $state('')
  let status = $state<string | null>(null)
  let error = $state<string | null>(null)

  async function loadPasskeys() {
    const { data, error: apiError } =
      await authClient.passkey.listUserPasskeys()
    if (apiError) {
      error = UNEXPECTED_ERROR_MESSAGE
      return
    }
    passkeys = data ?? []
  }

  onMount(loadPasskeys)

  async function registerPasskey(event: SubmitEvent) {
    event.preventDefault()
    status = null
    error = null

    // The browser takes over from here (Face ID/Windows Hello/security key
    // prompt); the name is only a label for telling passkeys apart later.
    const name = passkeyName.trim()
    const result = await authClient.passkey.addPasskey(name ? { name } : {})
    const apiError = result?.error ?? null

    error = addPasskeyErrorMessage(apiError)
    if (apiError) return
    status = PASSKEY_ADDED_MESSAGE
    passkeyName = ''
    await loadPasskeys()
  }

  async function removePasskey(id: string) {
    status = null
    error = null
    const { error: apiError } = await authClient.passkey.deletePasskey({ id })

    if (apiError) {
      error = UNEXPECTED_ERROR_MESSAGE
      return
    }
    status = PASSKEY_REMOVED_MESSAGE
    await loadPasskeys()
  }
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>Passkeys</Card.Title>
    <Card.Description>
      Sign in without your password using your device’s screen lock or a
      hardware security key. A passkey only works on the device or password
      manager where you save it.
    </Card.Description>
  </Card.Header>
  <Card.Content class="flex flex-col gap-4 pt-4">
    <StatusAlerts {error} {status} />

    {#if passkeys.length === 0}
      <Alert.Root class="mt-[-24px]" role="status">
        <SquareDashedIcon />
        <Alert.Description>No passkeys yet.</Alert.Description>
      </Alert.Root>
    {:else}
      <ul class="flex flex-col gap-2">
        {#each passkeys as pk (pk.id)}
          <li
            class="flex items-center justify-between gap-4 rounded-md border p-3"
          >
            <div class="flex flex-col">
              <span class="text-body">{pk.name || 'Passkey'}</span>
              <span class="text-caption text-muted-foreground">
                Added {new Date(pk.createdAt).toLocaleDateString()}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              aria-label={`Remove ${pk.name || 'Passkey'}`}
              onclick={() => removePasskey(pk.id)}
            >
              Remove
            </Button>
          </li>
        {/each}
      </ul>
    {/if}

    <form class="flex flex-col gap-4" novalidate onsubmit={registerPasskey}>
      <div class="flex flex-col gap-1.5">
        <label class="text-body" for="passkey-name">Passkey name</label>
        <Input
          id="passkey-name"
          type="text"
          autocomplete="off"
          placeholder="e.g. Work laptop"
          bind:value={passkeyName}
        />
      </div>
      <Button type="submit" class="self-start">Add passkey</Button>
    </form>
  </Card.Content>
</Card.Root>
