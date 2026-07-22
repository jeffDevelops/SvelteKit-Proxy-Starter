<script lang="ts">
  import * as Card from '$lib/components/ui/card/index.js'
  import ThemeToggle from '$lib/components/ThemeToggle.svelte'
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>Appearance</Card.Title>
    <Card.Description>
      Choose how auth-starter looks on this device.
    </Card.Description>
  </Card.Header>
  <Card.Content>
    <div class="w-fit mt-[-8px]">
      <ThemeToggle />
    </div>
  </Card.Content>
</Card.Root>
