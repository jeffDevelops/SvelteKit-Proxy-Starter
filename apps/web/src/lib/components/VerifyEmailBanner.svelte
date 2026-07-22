<script lang="ts">
  import { authClient } from '$lib/auth-client'
  import { Button } from '$lib/components/ui/button/index.js'
  import MailWarningIcon from '@lucide/svelte/icons/mail-warning'

  const { email }: { email: string } = $props()

  let sent = $state(false)

  async function resend() {
    const { error } = await authClient.sendVerificationEmail({
      email,
      callbackURL: '/app/verify-email',
    })
    if (!error) sent = true
  }
</script>

<div
  role="status"
  class="bg-muted text-muted-foreground flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2"
>
  <p class="text-body flex items-center gap-2">
    <MailWarningIcon class="size-4 shrink-0" aria-hidden="true" />
    Confirm your email — we sent a link to {email}.
  </p>
  <Button variant="outline" size="sm" disabled={sent} onclick={resend}>
    {sent ? 'Sent' : 'Resend email'}
  </Button>
</div>
