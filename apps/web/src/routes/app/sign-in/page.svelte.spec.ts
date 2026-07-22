import { page } from 'vitest/browser'
import SignInPage from './+page.svelte'
import {
  PASSKEY_SIGN_IN_FAILED_MESSAGE,
  SIGN_IN_FAILED_MESSAGE,
  UNEXPECTED_ERROR_MESSAGE,
} from '$lib/validation'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'

const { signInEmailMock, signInPasskeyMock, gotoMock } = vi.hoisted(() => ({
  signInEmailMock: vi.fn().mockResolvedValue({ data: {}, error: null }),
  signInPasskeyMock: vi.fn().mockResolvedValue({ data: {}, error: null }),
  gotoMock: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('$app/navigation', () => ({
  goto: gotoMock,
}))

vi.mock('$lib/auth-client', () => ({
  authClient: {
    useSession: () => ({
      subscribe: (run: (value: { data: null }) => void) => {
        run({ data: null })
        return () => {}
      },
    }),
    signIn: {
      email: signInEmailMock,
      passkey: signInPasskeyMock,
    },
  },
  signOut: vi.fn(),
}))

describe('Sign In Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('tells the user they are on the sign in page', async () => {
    render(SignInPage)
    await expect.element(page.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument()
  })

  it('tells the user what they are signing into by displaying the logo', async () => {
    render(SignInPage)
    await expect.element(page.getByRole('img', { name: 'Logo' })).toBeInTheDocument()
  })

  it('renders an email input', async () => {
    render(SignInPage)
    const emailInput = page.getByLabelText('Email')
    await expect.element(emailInput).toBeInTheDocument()
    await expect.element(emailInput).toHaveAttribute('type', 'email')
    await expect.element(emailInput).toHaveAttribute('required', '')
  })

  it('renders a password input without exposing the sign-up password policy', async () => {
    render(SignInPage)
    const passwordInput = page.getByLabelText('Password')
    await expect.element(passwordInput).toBeInTheDocument()
    await expect.element(passwordInput).toHaveAttribute('type', 'password')
    await expect.element(passwordInput).toHaveAttribute('required', '')
    await expect.element(passwordInput).not.toHaveAttribute('minlength')
  })

  it('renders a sign in button', async () => {
    render(SignInPage)
    await expect
      .element(page.getByRole('button', { name: 'Sign In', exact: true }))
      .toBeInTheDocument()
  })

  it('renders a link to sign up if the user does not have an account', async () => {
    render(SignInPage)
    await expect.element(page.getByRole('link', { name: 'Sign Up' })).toBeInTheDocument()
  })

  it('renders a link to the forgot-password flow', async () => {
    render(SignInPage)
    const link = page.getByRole('link', { name: 'Forgot password?' })
    await expect.element(link).toHaveAttribute('href', '/app/forgot-password')
  })

  describe('email validation', () => {
    it('does not show a validation error before the field is blurred', async () => {
      render(SignInPage)
      const emailInput = page.getByLabelText('Email')
      await emailInput.fill('not-an-email')
      await expect.element(page.getByText('Enter a valid email address')).not.toBeInTheDocument()
    })

    it('shows a validation error once the field is blurred with an invalid value', async () => {
      render(SignInPage)
      const emailInput = page.getByLabelText('Email')
      await emailInput.fill('not-an-email')
      emailInput.element().blur()
      await expect.element(page.getByText('Enter a valid email address')).toBeInTheDocument()
    })
  })

  describe('password validation', () => {
    it('requires a password once the field is blurred', async () => {
      render(SignInPage)
      const passwordInput = page.getByLabelText('Password')
      await passwordInput.fill('')
      passwordInput.element().blur()
      await expect.element(page.getByText('Password is required')).toBeInTheDocument()
    })

    it('does not surface the minimum-length rule on sign in', async () => {
      render(SignInPage)
      const passwordInput = page.getByLabelText('Password')
      await passwordInput.fill('short')
      passwordInput.element().blur()
      await expect
        .element(page.getByText('Password must be at least 8 characters'))
        .not.toBeInTheDocument()
    })
  })

  it('signs in with the entered credentials on submit', async () => {
    render(SignInPage)
    await page.getByLabelText('Email').fill('jeff@example.com')
    await page.getByLabelText('Password').fill('password123')
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()

    expect(signInEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'jeff@example.com',
        password: 'password123',
      }),
    )
  })

  it('navigates to the app after a successful sign in', async () => {
    render(SignInPage)
    await page.getByLabelText('Email').fill('jeff@example.com')
    await page.getByLabelText('Password').fill('password123')
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()

    await vi.waitFor(() => {
      expect(gotoMock).toHaveBeenCalledWith('/app', { invalidateAll: true })
    })
  })

  it('routes to the two-factor challenge instead of the app when required', async () => {
    signInEmailMock.mockResolvedValueOnce({
      data: { twoFactorRedirect: true },
      error: null,
    })
    render(SignInPage)
    await page.getByLabelText('Email').fill('jeff@example.com')
    await page.getByLabelText('Password').fill('password123')
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()

    await vi.waitFor(() => {
      expect(gotoMock).toHaveBeenCalledWith('/app/two-factor')
    })
    expect(gotoMock).not.toHaveBeenCalledWith('/app', { invalidateAll: true })
  })

  describe('server errors', () => {
    async function submitValidForm() {
      await page.getByLabelText('Email').fill('jeff@example.com')
      await page.getByLabelText('Password').fill('password123')
      await page.getByRole('button', { name: 'Sign In', exact: true }).click()
    }

    it('does not render an alert before a submission fails', async () => {
      render(SignInPage)
      await expect.element(page.getByLabelText('Email')).toBeInTheDocument()
      expect(page.getByRole('alert').elements()).toHaveLength(0)
    })

    it('shows a single indistinguishable alert for wrong password or unknown email', async () => {
      signInEmailMock.mockResolvedValueOnce({
        data: null,
        error: {
          code: 'INVALID_EMAIL_OR_PASSWORD',
          message: 'Invalid email or password',
          status: 401,
        },
      })
      render(SignInPage)
      await submitValidForm()
      await expect.element(page.getByRole('alert')).toHaveTextContent(SIGN_IN_FAILED_MESSAGE)
    })

    it('never renders the raw server error message', async () => {
      signInEmailMock.mockResolvedValueOnce({
        data: null,
        error: {
          code: 'INVALID_EMAIL_OR_PASSWORD',
          message: 'No user found in database',
          status: 401,
        },
      })
      render(SignInPage)
      await submitValidForm()
      await expect.element(page.getByRole('alert')).toBeInTheDocument()
      await expect.element(page.getByText('No user found in database')).not.toBeInTheDocument()
    })

    it('shows the generic unexpected alert for unrecognized failures', async () => {
      signInEmailMock.mockResolvedValueOnce({
        data: null,
        error: { code: 'INTERNAL_SERVER_ERROR', message: 'boom', status: 500 },
      })
      render(SignInPage)
      await submitValidForm()
      await expect.element(page.getByRole('alert')).toHaveTextContent(UNEXPECTED_ERROR_MESSAGE)
    })

    it('does not navigate away when sign in fails', async () => {
      signInEmailMock.mockResolvedValueOnce({
        data: null,
        error: {
          code: 'INVALID_EMAIL_OR_PASSWORD',
          message: 'Invalid email or password',
          status: 401,
        },
      })
      render(SignInPage)
      await submitValidForm()
      await expect.element(page.getByRole('alert')).toBeInTheDocument()
      expect(gotoMock).not.toHaveBeenCalled()
    })

    it('clears the alert when a retry succeeds', async () => {
      signInEmailMock.mockResolvedValueOnce({
        data: null,
        error: {
          code: 'INVALID_EMAIL_OR_PASSWORD',
          message: 'Invalid email or password',
          status: 401,
        },
      })
      render(SignInPage)
      await submitValidForm()
      await expect.element(page.getByRole('alert')).toBeInTheDocument()

      await page.getByRole('button', { name: 'Sign In', exact: true }).click()
      await expect.element(page.getByRole('alert')).not.toBeInTheDocument()
    })
  })

  describe('passkey sign-in', () => {
    it('offers passkey sign-in without requiring the form fields', async () => {
      render(SignInPage)
      await page.getByRole('button', { name: 'Sign in with a passkey' }).click()

      expect(signInPasskeyMock).toHaveBeenCalled()
      // Clicking it must not run the email/password validators
      expect(page.getByText('Email is required').elements()).toHaveLength(0)
      expect(page.getByText('Password is required').elements()).toHaveLength(0)
    })

    it('navigates to the app after a successful passkey sign-in', async () => {
      render(SignInPage)
      await page.getByRole('button', { name: 'Sign in with a passkey' }).click()

      await vi.waitFor(() => {
        expect(gotoMock).toHaveBeenCalledWith('/app', { invalidateAll: true })
      })
    })

    it('shows one indistinguishable failure message and suggests the password fallback', async () => {
      signInPasskeyMock.mockResolvedValueOnce({
        data: null,
        error: {
          code: 'UNABLE_TO_VERIFY_AUTHENTICATION',
          message: 'credential not found',
          status: 401,
        },
      })
      render(SignInPage)
      await page.getByRole('button', { name: 'Sign in with a passkey' }).click()

      await expect
        .element(page.getByRole('alert'))
        .toHaveTextContent(PASSKEY_SIGN_IN_FAILED_MESSAGE)
      expect(gotoMock).not.toHaveBeenCalled()
    })

    it('stays silent when the user dismisses the browser prompt', async () => {
      signInPasskeyMock.mockResolvedValueOnce({
        data: null,
        error: { code: 'ERROR_CEREMONY_ABORTED', message: 'Authentication cancelled', status: 400 },
      })
      render(SignInPage)
      await page.getByRole('button', { name: 'Sign in with a passkey' }).click()

      expect(page.getByRole('alert').elements()).toHaveLength(0)
      expect(gotoMock).not.toHaveBeenCalled()
    })
  })

  describe('theme toggle', () => {
    it('renders the theme toggle', async () => {
      render(SignInPage)
      await expect.element(page.getByRole('group', { name: 'Theme' })).toBeInTheDocument()
    })

    it('switches between dark and light mode', async () => {
      render(SignInPage)
      await page.getByRole('button', { name: 'Dark' }).click()
      expect(document.documentElement.classList.contains('dark')).toBe(true)

      await page.getByRole('button', { name: 'Light' }).click()
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })
  })
})
