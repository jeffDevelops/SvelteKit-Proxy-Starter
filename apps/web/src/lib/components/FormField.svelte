<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements'
  import type { Snippet } from 'svelte'
  import { Input } from '$lib/components/ui/input/index.js'
  import type { ValidatedField } from '$lib/hooks/validated-field.svelte'

  // The one way to render a labeled, blur-validated input: label/id
  // association, aria-invalid, and the `${id}-error` describedby contract
  // live here so they can't drift between forms.
  interface Props extends Omit<HTMLInputAttributes, 'id' | 'value'> {
    id: string
    label: string
    field: ValidatedField<string>
    /** Rendered right-aligned beside the label (e.g. a forgot-password link). */
    labelAccessory?: Snippet
  }

  let { id, label, field, labelAccessory, ...inputProps }: Props = $props()
</script>

<div class="flex flex-col gap-1.5">
  {#if labelAccessory}
    <div class="flex items-center justify-between">
      <label class="text-body" for={id}>{label}</label>
      {@render labelAccessory()}
    </div>
  {:else}
    <label class="text-body" for={id}>{label}</label>
  {/if}
  <Input
    {id}
    aria-invalid={field.showError}
    aria-describedby={field.showError ? `${id}-error` : undefined}
    bind:value={field.value}
    onblur={field.onblur}
    {...inputProps}
  />
  {#if field.showError}
    <p id="{id}-error" class="text-body text-destructive">{field.error}</p>
  {/if}
</div>
