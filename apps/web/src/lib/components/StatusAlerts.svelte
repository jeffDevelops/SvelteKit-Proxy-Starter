<script lang="ts">
  import * as Alert from '$lib/components/ui/alert/index.js'
  import CircleAlertIcon from '@lucide/svelte/icons/circle-alert'
  import CircleCheckIcon from '@lucide/svelte/icons/circle-check'

  // The standard pair every form renders above its fields: a destructive
  // alert for the mapped error, a status alert for the success message.
  // Both stay unrendered while null.
  interface Props {
    error?: string | null
    status?: string | null
    /** Optional headline above the error text (e.g. "Unable to sign in"). */
    errorTitle?: string
  }

  let { error = null, status = null, errorTitle }: Props = $props()
</script>

{#if error}
  <Alert.Root variant="destructive">
    <CircleAlertIcon />
    {#if errorTitle}
      <Alert.Title>{errorTitle}</Alert.Title>
    {/if}
    <Alert.Description>{error}</Alert.Description>
  </Alert.Root>
{/if}
{#if status}
  <Alert.Root role="status">
    <CircleCheckIcon />
    <Alert.Description>{status}</Alert.Description>
  </Alert.Root>
{/if}
