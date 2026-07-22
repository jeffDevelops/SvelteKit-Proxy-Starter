<script lang="ts">
  import type { PageProps } from './$types'
  import EmailCard from './EmailCard.svelte'
  import DevicesCard from './DevicesCard.svelte'
  import UsernameCard from './UsernameCard.svelte'
  import PasswordCard from './PasswordCard.svelte'
  import PasskeysCard from './PasskeysCard.svelte'
  import TwoFactorCard from './TwoFactorCard.svelte'
  import AppearanceCard from './AppearanceCard.svelte'
  import DeleteAccountCard from './DeleteAccountCard.svelte'

  const { data }: PageProps = $props()
</script>

<div class="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-8">
  <h1 class="text-heading">Settings</h1>

  <section class="flex flex-col gap-4" aria-labelledby="settings-appearance">
    <h2 id="settings-appearance" class="text-subheading">Appearance</h2>
    <AppearanceCard />
  </section>

  <section class="flex flex-col gap-4" aria-labelledby="settings-security">
    <h2 id="settings-security" class="text-subheading">
      Sign-in &amp; security
    </h2>
    <EmailCard
      email={data.user?.email ?? ''}
      emailVerified={data.user?.emailVerified ?? false}
    />
    <PasswordCard />
    <PasskeysCard />
    <TwoFactorCard enabled={data.user?.twoFactorEnabled ?? false} />
    <DevicesCard currentToken={data.session?.token} />
  </section>

  <section class="flex flex-col gap-4" aria-labelledby="settings-danger">
    <h2 id="settings-danger" class="text-subheading text-destructive">
      Danger Zone
    </h2>
    <p class="text-muted-foreground">
      Use caution. These changes involve deletion of data, or have the
      potential to break links that point at your account.
    </p>
    <UsernameCard name={data.user?.name ?? ''} />
    <DeleteAccountCard />
  </section>
</div>
