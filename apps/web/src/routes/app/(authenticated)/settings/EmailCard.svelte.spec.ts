import { page } from 'vitest/browser'
import EmailCard from './EmailCard.svelte'
import {
  EMAIL_CHANGE_APPROVED_MESSAGE,
  EMAIL_CHANGE_COMPLETED_MESSAGE,
  EMAIL_CHANGE_LINK_INVALID_MESSAGE,
  EMAIL_SAME_MESSAGE,
  emailChangeApprovalRequestedMessage,
  emailChangeRequestedMessage,
} from '$lib/validation'
import { EMAIL_CHANGE_APPROVED_PATH, EMAIL_CHANGE_COMPLETED_PATH } from '@auth-starter/validation'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'

const { changeEmailMock, appState } = vi.hoisted(() => ({
  changeEmailMock: vi.fn().mockResolvedValue({ data: { status: true }, error: null }),
  appState: { page: { url: new URL('http://localhost/app/settings') } },
}))

vi.mock('$app/state', () => appState)
vi.mock('$lib/auth-client', () => ({ authClient: { changeEmail: changeEmailMock } }))

function renderCard(overrides: { email?: string; emailVerified?: boolean } = {}) {
  return render(EmailCard, {
    props: { email: 'jeff@example.com', emailVerified: true, ...overrides },
  })
}

describe('EmailCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    appState.page.url = new URL('http://localhost/app/settings')
  })

  it('requests approval from the current address when the account is verified', async () => {
    renderCard()
    await page.getByLabelText('New email').fill('new@example.com')
    await page.getByRole('button', { name: 'Change email' }).click()

    expect(changeEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        newEmail: 'new@example.com',
        callbackURL: EMAIL_CHANGE_APPROVED_PATH,
      }),
    )
    await expect
      .element(page.getByText(emailChangeApprovalRequestedMessage('jeff@example.com')))
      .toBeInTheDocument()
  })

  it('sends verification straight to the new address when the account is unverified', async () => {
    renderCard({ emailVerified: false })
    await page.getByLabelText('New email').fill('new@example.com')
    await page.getByRole('button', { name: 'Change email' }).click()

    expect(changeEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ callbackURL: EMAIL_CHANGE_COMPLETED_PATH }),
    )
    await expect
      .element(page.getByText(emailChangeRequestedMessage('new@example.com')))
      .toBeInTheDocument()
  })

  it('rejects re-entering the current address without calling the API', async () => {
    renderCard()
    await page.getByLabelText('New email').fill('JEFF@example.com')
    await page.getByRole('button', { name: 'Change email' }).click()

    expect(changeEmailMock).not.toHaveBeenCalled()
    await expect.element(page.getByText(EMAIL_SAME_MESSAGE)).toBeInTheDocument()
  })

  it('explains the second step when landing from the approval link', async () => {
    appState.page.url = new URL('http://localhost/app/settings?email-change=approved')
    renderCard()

    await expect.element(page.getByText(EMAIL_CHANGE_APPROVED_MESSAGE)).toBeInTheDocument()
  })

  it('confirms the change when landing from the new-address verification link', async () => {
    appState.page.url = new URL('http://localhost/app/settings?email-change=completed')
    renderCard({ email: 'new@example.com' })

    await expect.element(page.getByText(EMAIL_CHANGE_COMPLETED_MESSAGE)).toBeInTheDocument()
    await expect.element(page.getByText('Currently new@example.com')).toBeInTheDocument()
  })

  it('reports an expired or invalid change link', async () => {
    appState.page.url = new URL(
      'http://localhost/app/settings?email-change=approved&error=INVALID_TOKEN',
    )
    renderCard()

    await expect.element(page.getByText(EMAIL_CHANGE_LINK_INVALID_MESSAGE)).toBeInTheDocument()
    expect(page.getByText(EMAIL_CHANGE_APPROVED_MESSAGE).elements()).toHaveLength(0)
  })
})
