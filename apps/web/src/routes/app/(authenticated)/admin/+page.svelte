<script lang="ts">
  import {
    adminActionErrorMessage,
    sessionsErrorMessage,
    USER_BANNED_MESSAGE,
    USER_UNBANNED_MESSAGE,
  } from '$lib/validation'
  import { onMount } from 'svelte'
  import { authClient } from '$lib/auth-client'
  import * as Card from '$lib/components/ui/card/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import StatusAlerts from '$lib/components/StatusAlerts.svelte'
  import IpBansCard from './IpBansCard.svelte'

  type AdminUser = {
    id: string
    name: string
    email: string
    role?: string | null
    banned?: boolean | null
    banReason?: string | null
    banExpires?: string | Date | null
    createdAt: string | Date
  }

  let users = $state<AdminUser[]>([])
  let searchTerm = $state('')
  let status = $state<string | null>(null)
  let error = $state<string | null>(null)

  // Inline ban form state — one row at a time
  let banningId = $state<string | null>(null)
  let banReason = $state('')
  let banDays = $state('')

  async function loadUsers() {
    const term = searchTerm.trim()
    const { data, error: apiError } = await authClient.admin.listUsers({
      query: {
        limit: 20,
        sortBy: 'createdAt',
        sortDirection: 'desc',
        ...(term
          ? {
              searchValue: term,
              // One searchable field per query — @ means they typed an email
              searchField: term.includes('@') ? 'email' : 'name',
              searchOperator: 'contains',
            }
          : {}),
      },
    })

    if (apiError) {
      error = sessionsErrorMessage(apiError)
      return
    }
    users = (data?.users as AdminUser[]) ?? []
  }

  onMount(loadUsers)

  async function search(event: SubmitEvent) {
    event.preventDefault()
    status = null
    error = null
    await loadUsers()
  }

  function startBan(id: string) {
    banningId = id
    banReason = ''
    banDays = ''
    status = null
    error = null
  }

  async function confirmBan(event: SubmitEvent) {
    event.preventDefault()
    if (!banningId) return

    status = null
    error = null
    const days = Number(banDays)
    const { error: apiError } = await authClient.admin.banUser({
      userId: banningId,
      ...(banReason.trim() ? { banReason: banReason.trim() } : {}),
      // Empty duration = permanent (Better Auth default: never expires)
      ...(Number.isFinite(days) && days > 0
        ? { banExpiresIn: days * 86400 }
        : {}),
    })

    error = adminActionErrorMessage(apiError)
    if (apiError) return
    status = USER_BANNED_MESSAGE
    banningId = null
    await loadUsers()
  }

  async function unban(id: string) {
    status = null
    error = null
    const { error: apiError } = await authClient.admin.unbanUser({ userId: id })

    error = adminActionErrorMessage(apiError)
    if (apiError) return
    status = USER_UNBANNED_MESSAGE
    await loadUsers()
  }
</script>

<div class="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
  <h1 class="text-heading">Admin</h1>

  <Card.Root>
    <Card.Header>
      <Card.Title>Users</Card.Title>
      <Card.Description>
        Platform bans block sign-in on every method and sign the user out
        everywhere. Bans without a duration last until lifted.
      </Card.Description>
    </Card.Header>
    <Card.Content class="flex flex-col gap-4 pt-4">
      <StatusAlerts {error} {status} />

      <form class="flex items-end gap-2" novalidate onsubmit={search}>
        <div class="flex flex-1 flex-col gap-1.5">
          <label class="text-body" for="user-search">
            Search by username or email
          </label>
          <Input
            id="user-search"
            type="search"
            autocomplete="off"
            bind:value={searchTerm}
          />
        </div>
        <Button type="submit" variant="outline">Search</Button>
      </form>

      <ul class="flex flex-col gap-2">
        {#each users as u (u.id)}
          <li class="flex flex-col gap-3 rounded-md border p-3">
            <div class="flex items-center justify-between gap-4">
              <div class="flex flex-col">
                <span class="text-body">
                  {u.name}
                  {#if u.role === 'admin'}
                    <span class="text-caption text-muted-foreground">
                      · admin
                    </span>
                  {/if}
                </span>
                <span class="text-caption text-muted-foreground">
                  {u.email}
                </span>
                {#if u.banned}
                  <span class="text-caption text-destructive">
                    Banned{u.banReason ? `: ${u.banReason}` : ''}
                  </span>
                {/if}
              </div>
              {#if u.banned}
                <Button
                  variant="outline"
                  size="sm"
                  aria-label={`Unban ${u.name}`}
                  onclick={() => unban(u.id)}
                >
                  Unban
                </Button>
              {:else if banningId !== u.id}
                <Button
                  variant="destructive"
                  size="sm"
                  aria-label={`Ban ${u.name}`}
                  onclick={() => startBan(u.id)}
                >
                  Ban
                </Button>
              {/if}
            </div>

            {#if banningId === u.id}
              <form
                class="flex flex-col gap-3 border-t pt-3"
                novalidate
                onsubmit={confirmBan}
              >
                <div class="flex flex-col gap-1.5">
                  <label class="text-body" for="ban-reason">Ban reason</label>
                  <Input
                    id="ban-reason"
                    type="text"
                    autocomplete="off"
                    bind:value={banReason}
                  />
                </div>
                <div class="flex flex-col gap-1.5">
                  <label class="text-body" for="ban-days">
                    Duration in days (leave empty for permanent)
                  </label>
                  <Input
                    id="ban-days"
                    type="number"
                    min="1"
                    autocomplete="off"
                    bind:value={banDays}
                  />
                </div>
                <div class="flex gap-2">
                  <Button type="submit" variant="destructive" size="sm">
                    Confirm ban
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onclick={() => (banningId = null)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            {/if}
          </li>
        {/each}
      </ul>
    </Card.Content>
  </Card.Root>

  <IpBansCard />
</div>
