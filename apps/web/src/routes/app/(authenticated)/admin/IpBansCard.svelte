<script lang="ts">
  import {
    ipBanErrorMessage,
    IP_BAN_ADDED_MESSAGE,
    IP_BAN_REMOVED_MESSAGE,
    UNEXPECTED_ERROR_MESSAGE,
  } from '$lib/validation'
  import { onMount } from 'svelte'
  import * as Card from '$lib/components/ui/card/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import StatusAlerts from '$lib/components/StatusAlerts.svelte'

  type IpBanRow = {
    id: string
    ip: string
    reason?: string | null
    expiresAt?: string | null
  }

  let bans = $state<IpBanRow[]>([])
  let ip = $state('')
  let reason = $state('')
  let days = $state('')
  let status = $state<string | null>(null)
  let error = $state<string | null>(null)

  async function loadBans() {
    const response = await fetch('/api/admin/ip-bans')
    if (!response.ok) {
      error = UNEXPECTED_ERROR_MESSAGE
      return
    }
    bans = await response.json()
  }

  onMount(loadBans)

  async function addBan(event: SubmitEvent) {
    event.preventDefault()
    status = null
    error = null

    const expiresInDays = Number(days)
    const response = await fetch('/api/admin/ip-bans', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ip: ip.trim(),
        ...(reason.trim() ? { reason: reason.trim() } : {}),
        ...(Number.isFinite(expiresInDays) && expiresInDays > 0
          ? { expiresInDays }
          : {}),
      }),
    })

    if (!response.ok) {
      const body = await response.json().catch(() => null)
      error = ipBanErrorMessage(body?.code ?? 'INTERNAL_ERROR')
      return
    }
    status = IP_BAN_ADDED_MESSAGE
    ip = ''
    reason = ''
    days = ''
    await loadBans()
  }

  async function removeBan(id: string) {
    status = null
    error = null
    const response = await fetch(`/api/admin/ip-bans/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      error = UNEXPECTED_ERROR_MESSAGE
      return
    }
    status = IP_BAN_REMOVED_MESSAGE
    await loadBans()
  }
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>IP bans</Card.Title>
    <Card.Description>
      Blocks all auth actions from an address. A speed bump, not a wall — VPNs
      route around it, and shared addresses can lock out bystanders. Prefer user
      bans; prefer expiring IP bans over permanent ones.
    </Card.Description>
  </Card.Header>
  <Card.Content class="flex flex-col gap-4 pt-4">
    <StatusAlerts {error} {status} />

    {#if bans.length > 0}
      <ul class="flex flex-col gap-2">
        {#each bans as ban (ban.id)}
          <li
            class="flex items-center justify-between gap-4 rounded-md border p-3"
          >
            <div class="flex flex-col">
              <span class="text-body font-mono">{ban.ip}</span>
              <span class="text-caption text-muted-foreground">
                {ban.reason || 'No reason recorded'}
                · {ban.expiresAt
                  ? `until ${new Date(ban.expiresAt).toLocaleDateString()}`
                  : 'until lifted'}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              aria-label={`Remove ban on ${ban.ip}`}
              onclick={() => removeBan(ban.id)}
            >
              Remove
            </Button>
          </li>
        {/each}
      </ul>
    {/if}

    <form class="flex flex-col gap-3" novalidate onsubmit={addBan}>
      <div class="flex flex-col gap-1.5">
        <label class="text-body" for="ban-ip">IP address</label>
        <Input id="ban-ip" type="text" autocomplete="off" bind:value={ip} />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-body" for="ban-ip-reason">Reason</label>
        <Input
          id="ban-ip-reason"
          type="text"
          autocomplete="off"
          bind:value={reason}
        />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-body" for="ban-ip-days">
          Duration in days (leave empty for until lifted)
        </label>
        <Input
          id="ban-ip-days"
          type="number"
          min="1"
          autocomplete="off"
          bind:value={days}
        />
      </div>
      <Button type="submit" variant="destructive" class="self-start">
        Ban IP
      </Button>
    </form>
  </Card.Content>
</Card.Root>
