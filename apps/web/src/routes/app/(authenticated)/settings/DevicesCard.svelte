<script lang="ts">
  import {
    sessionsErrorMessage,
    OTHER_SESSIONS_REVOKED_MESSAGE,
    SESSION_REVOKED_MESSAGE,
  } from '$lib/validation'
  import { onMount } from 'svelte'
  import { authClient } from '$lib/auth-client'
  import * as Card from '$lib/components/ui/card/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import StatusAlerts from '$lib/components/StatusAlerts.svelte'
  import { describeUserAgent } from '$lib/user-agent'

  interface Props {
    /** Token of the session viewing this page — its row can't revoke itself. */
    currentToken?: string
  }

  let { currentToken }: Props = $props()

  type StoredSession = {
    id: string
    token: string
    userAgent?: string | null
    ipAddress?: string | null
    updatedAt: string | Date
  }

  let sessions = $state<StoredSession[]>([])
  let status = $state<string | null>(null)
  let error = $state<string | null>(null)

  async function loadSessions() {
    const { data, error: apiError } = await authClient.listSessions()
    if (apiError) {
      error = sessionsErrorMessage(apiError)
      return
    }
    sessions = data ?? []
  }

  onMount(loadSessions)

  async function signOutSession(token: string) {
    status = null
    error = null
    const { error: apiError } = await authClient.revokeSession({ token })

    error = sessionsErrorMessage(apiError)
    if (apiError) return
    status = SESSION_REVOKED_MESSAGE
    await loadSessions()
  }

  async function signOutOtherSessions() {
    status = null
    error = null
    const { error: apiError } = await authClient.revokeOtherSessions()

    error = sessionsErrorMessage(apiError)
    if (apiError) return
    status = OTHER_SESSIONS_REVOKED_MESSAGE
    await loadSessions()
  }
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>Devices</Card.Title>
    <Card.Description>
      Everywhere your account is signed in right now. Sign out anything you
      don’t recognize — and change your password if you didn’t sign in there.
    </Card.Description>
  </Card.Header>
  <Card.Content class="flex flex-col gap-4 pt-4 mt-[-24px]">
    <StatusAlerts {error} {status} />

    <ul class="flex flex-col gap-2">
      {#each sessions as s (s.id)}
        <li
          class="flex items-center justify-between gap-4 rounded-md border p-3"
        >
          <div class="flex flex-col">
            <span class="text-body">{describeUserAgent(s.userAgent)}</span>
            <span class="text-caption text-muted-foreground">
              {s.ipAddress || 'Unknown address'} · Last active {new Date(
                s.updatedAt,
              ).toLocaleDateString()}
            </span>
          </div>
          {#if s.token === currentToken}
            <span class="text-caption text-muted-foreground">This device</span>
          {:else}
            <Button
              variant="outline"
              size="sm"
              aria-label={`Sign out ${describeUserAgent(s.userAgent)}`}
              onclick={() => signOutSession(s.token)}
            >
              Sign out
            </Button>
          {/if}
        </li>
      {/each}
    </ul>

    <Button variant="outline" class="self-start" onclick={signOutOtherSessions}>
      Sign out other devices
    </Button>
  </Card.Content>
</Card.Root>
