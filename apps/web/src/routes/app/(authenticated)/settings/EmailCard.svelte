<script lang="ts">
  import {
    emailChangeApprovalRequestedMessage,
    emailChangeLandingStatus,
    emailChangeRequestedMessage,
    validateEmail,
    EMAIL_SAME_MESSAGE,
    UNEXPECTED_ERROR_MESSAGE,
  } from '$lib/validation'
  import {
    EMAIL_CHANGE_APPROVED_PATH,
    EMAIL_CHANGE_COMPLETED_PATH,
  } from '@auth-starter/validation'
  import { page } from '$app/state'
  import { authClient } from '$lib/auth-client'
  import * as Card from '$lib/components/ui/card/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import FormField from '$lib/components/FormField.svelte'
  import StatusAlerts from '$lib/components/StatusAlerts.svelte'
  import { ValidatedField } from '$lib/hooks/validated-field.svelte'

  interface Props {
    email: string
    emailVerified: boolean
  }

  let { email, emailVerified }: Props = $props()

  const newEmail = new ValidatedField('', validateEmail)

  // The change-email links land back here with a stage (or error) in the
  // query string — surface it as the card's initial alert. Each link click
  // is a full navigation, so capturing the initial value is enough.
  const landing = emailChangeLandingStatus(page.url.searchParams)

  let status = $state<string | null>(landing.status)
  let error = $state<string | null>(landing.error)

  async function requestEmailChange(event: SubmitEvent) {
    event.preventDefault()
    newEmail.onblur()
    if (newEmail.invalid) return

    status = null
    error = null
    if (newEmail.value.toLowerCase() === email.toLowerCase()) {
      error = EMAIL_SAME_MESSAGE
      return
    }

    // Verified accounts approve from the current inbox first (two legs);
    // unverified ones verify straight from the new inbox (one leg). The
    // callbackURL tells the API which flow this is and where each link
    // should land (see @auth-starter/validation).
    const { error: apiError } = await authClient.changeEmail({
      newEmail: newEmail.value,
      callbackURL: emailVerified
        ? EMAIL_CHANGE_APPROVED_PATH
        : EMAIL_CHANGE_COMPLETED_PATH,
    })

    if (apiError) {
      error = UNEXPECTED_ERROR_MESSAGE
      return
    }
    status = emailVerified
      ? emailChangeApprovalRequestedMessage(email)
      : emailChangeRequestedMessage(newEmail.value)
  }
</script>

<Card.Root>
  <form novalidate onsubmit={requestEmailChange}>
    <Card.Header>
      <Card.Title>Email</Card.Title>
      <Card.Description>
        Currently <strong>{email}</strong>. Changing it requires 2 steps: 1)
        you'll be asked to confirm the email address change from the old email
        address to prevent your account from being hijacked, and 2) you'll be
        asked to confirm the new email address.
      </Card.Description>
    </Card.Header>
    <Card.Content class="flex flex-col gap-4 pt-4">
      <StatusAlerts {error} {status} />

      <FormField
        id="new-email"
        label="New email"
        field={newEmail}
        type="email"
        required
        autocomplete="email"
      />
    </Card.Content>
    <Card.Footer class="pt-4">
      <Button type="submit">Change email</Button>
    </Card.Footer>
  </form>
</Card.Root>
