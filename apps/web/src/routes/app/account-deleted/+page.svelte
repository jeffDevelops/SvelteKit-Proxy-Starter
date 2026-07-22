<script lang="ts">
  import AuthShell from '$lib/components/AuthShell.svelte'
</script>

<AuthShell title="Account deleted">
  <p class="text-body text-muted-foreground text-center">
    Your account has been closed and you’ve been signed out everywhere. Changed
    your mind? Contact support — accounts can be restored for a limited time.
  </p>

  <p class="text-caption text-center">
    Want a fresh start?
    <a class="text-foreground underline underline-offset-4" href="/app/sign-up"
      >Sign Up</a
    >
  </p>
</AuthShell>
