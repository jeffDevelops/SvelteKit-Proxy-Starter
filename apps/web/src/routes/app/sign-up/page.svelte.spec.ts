import { page } from 'vitest/browser'
import SignUpPage from './+page.svelte'
import { SIGN_UP_CONFLICT_MESSAGE, UNEXPECTED_ERROR_MESSAGE } from '$lib/validation'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'

const { signUpEmailMock, gotoMock } = vi.hoisted(() => ({
  signUpEmailMock: vi.fn().mockResolvedValue({ data: {}, error: null }),
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
    signUp: {
      email: signUpEmailMock,
    },
  },
  signOut: vi.fn(),
}))

describe('Sign Up Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('tells the user they are on the sign up page', async () => {
    render(SignUpPage)
    await expect.element(page.getByRole('heading', { name: 'Sign Up' })).toBeInTheDocument()
  })

  it('tells the user what they are signing up for by displaying the logo', async () => {
    render(SignUpPage)
    await expect.element(page.getByRole('img', { name: 'Logo' })).toBeInTheDocument()
  })

  it('renders a username input', async () => {
    render(SignUpPage)
    const usernameInput = page.getByLabelText('Username')
    await expect.element(usernameInput).toBeInTheDocument()
    await expect.element(usernameInput).toHaveAttribute('type', 'text')
    await expect.element(usernameInput).toHaveAttribute('pattern', '[a-zA-Z0-9_]+')
    await expect.element(usernameInput).toHaveAttribute('required', '')
  })

  it('renders an email input', async () => {
    render(SignUpPage)
    const emailInput = page.getByLabelText('Email')
    await expect.element(emailInput).toBeInTheDocument()
    await expect.element(emailInput).toHaveAttribute('type', 'email')
    await expect.element(emailInput).toHaveAttribute('required', '')
  })

  it('renders a password input', async () => {
    render(SignUpPage)
    const passwordInput = page.getByLabelText('Password')
    await expect.element(passwordInput).toBeInTheDocument()
    await expect.element(passwordInput).toHaveAttribute('type', 'password')
    await expect.element(passwordInput).toHaveAttribute('required', '')
    await expect.element(passwordInput).toHaveAttribute('minlength', '8')
  })

  it('renders a sign up button', async () => {
    render(SignUpPage)
    await expect.element(page.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument()
  })

  it('renders a link to sign in if the user already has an account', async () => {
    render(SignUpPage)
    await expect.element(page.getByRole('link', { name: 'Sign In' })).toBeInTheDocument()
  })

  describe('username validation', () => {
    it('does not show a validation error before the field is blurred', async () => {
      render(SignUpPage)
      const usernameInput = page.getByLabelText('Username')
      await usernameInput.fill('not a valid username!')
      await expect
        .element(page.getByText('Username can only contain letters, numbers, and underscores'))
        .not.toBeInTheDocument()
    })

    it('shows a validation error once the field is blurred with an invalid value', async () => {
      render(SignUpPage)
      const usernameInput = page.getByLabelText('Username')
      await usernameInput.fill('not a valid username!')
      usernameInput.element().blur()
      await expect
        .element(page.getByText('Username can only contain letters, numbers, and underscores'))
        .toBeInTheDocument()
    })

    it('clears the validation error once the value becomes valid', async () => {
      render(SignUpPage)
      const usernameInput = page.getByLabelText('Username')
      await usernameInput.fill('not a valid username!')
      usernameInput.element().blur()
      await expect
        .element(page.getByText('Username can only contain letters, numbers, and underscores'))
        .toBeInTheDocument()

      await usernameInput.fill('valid_username')
      await expect
        .element(page.getByText('Username can only contain letters, numbers, and underscores'))
        .not.toBeInTheDocument()
    })
  })

  describe('email validation', () => {
    it('does not show a validation error before the field is blurred', async () => {
      render(SignUpPage)
      const emailInput = page.getByLabelText('Email')
      await emailInput.fill('not-an-email')
      await expect.element(page.getByText('Enter a valid email address')).not.toBeInTheDocument()
    })

    it('shows a validation error once the field is blurred with an invalid value', async () => {
      render(SignUpPage)
      const emailInput = page.getByLabelText('Email')
      await emailInput.fill('not-an-email')
      emailInput.element().blur()
      await expect.element(page.getByText('Enter a valid email address')).toBeInTheDocument()
    })
  })

  describe('password validation', () => {
    it('does not show a validation error before the field is blurred', async () => {
      render(SignUpPage)
      const passwordInput = page.getByLabelText('Password')
      await passwordInput.fill('short')
      await expect
        .element(page.getByText('Password must be at least 8 characters'))
        .not.toBeInTheDocument()
    })

    it('shows a validation error once the field is blurred with an invalid value', async () => {
      render(SignUpPage)
      const passwordInput = page.getByLabelText('Password')
      await passwordInput.fill('short')
      passwordInput.element().blur()
      await expect
        .element(page.getByText('Password must be at least 8 characters'))
        .toBeInTheDocument()
    })
  })

  describe('theme toggle', () => {
    it('renders the theme toggle', async () => {
      render(SignUpPage)
      await expect.element(page.getByRole('group', { name: 'Theme' })).toBeInTheDocument()
    })

    it('switches between dark and light mode', async () => {
      render(SignUpPage)
      await page.getByRole('button', { name: 'Dark' }).click()
      expect(document.documentElement.classList.contains('dark')).toBe(true)

      await page.getByRole('button', { name: 'Light' }).click()
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })
  })

  it('signs up with the username as the display name on submit', async () => {
    render(SignUpPage)
    await page.getByLabelText('Username').fill('valid_username')
    await page.getByLabelText('Email').fill('jeff@example.com')
    await page.getByLabelText('Password').fill('password123')
    await page.getByRole('button', { name: 'Sign Up' }).click()

    expect(signUpEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'jeff@example.com',
        password: 'password123',
        name: 'valid_username',
        callbackURL: '/app/verify-email',
      }),
    )
  })

  describe('server errors', () => {
    async function submitValidForm() {
      await page.getByLabelText('Username').fill('valid_username')
      await page.getByLabelText('Email').fill('jeff@example.com')
      await page.getByLabelText('Password').fill('password123')
      await page.getByRole('button', { name: 'Sign Up' }).click()
    }

    it('does not render an alert before a submission fails', async () => {
      render(SignUpPage)
      await expect.element(page.getByLabelText('Username')).toBeInTheDocument()
      expect(page.getByRole('alert').elements()).toHaveLength(0)
    })

    it('shows the generic conflict alert when the email is already registered', async () => {
      signUpEmailMock.mockResolvedValueOnce({
        data: null,
        error: { code: 'USER_ALREADY_EXISTS', message: 'User already exists', status: 422 },
      })
      render(SignUpPage)
      await submitValidForm()
      await expect.element(page.getByRole('alert')).toHaveTextContent(SIGN_UP_CONFLICT_MESSAGE)
    })

    it('shows the generic conflict alert when the username is already registered', async () => {
      signUpEmailMock.mockResolvedValueOnce({
        data: null,
        error: { code: 'USERNAME_UNAVAILABLE', message: 'Username unavailable', status: 422 },
      })
      render(SignUpPage)
      await submitValidForm()
      await expect.element(page.getByRole('alert')).toHaveTextContent(SIGN_UP_CONFLICT_MESSAGE)
    })

    it('never renders the raw server error message', async () => {
      signUpEmailMock.mockResolvedValueOnce({
        data: null,
        error: {
          code: 'USER_ALREADY_EXISTS',
          message: 'User already exists in database',
          status: 422,
        },
      })
      render(SignUpPage)
      await submitValidForm()
      await expect.element(page.getByRole('alert')).toBeInTheDocument()
      await expect
        .element(page.getByText('User already exists in database'))
        .not.toBeInTheDocument()
    })

    it('shows the generic unexpected alert for unrecognized failures', async () => {
      signUpEmailMock.mockResolvedValueOnce({
        data: null,
        error: { code: 'INTERNAL_SERVER_ERROR', message: 'boom', status: 500 },
      })
      render(SignUpPage)
      await submitValidForm()
      await expect.element(page.getByRole('alert')).toHaveTextContent(UNEXPECTED_ERROR_MESSAGE)
    })

    it('does not navigate away when sign up fails', async () => {
      signUpEmailMock.mockResolvedValueOnce({
        data: null,
        error: { code: 'USER_ALREADY_EXISTS', message: 'User already exists', status: 422 },
      })
      render(SignUpPage)
      await submitValidForm()
      await expect.element(page.getByRole('alert')).toBeInTheDocument()
      expect(gotoMock).not.toHaveBeenCalled()
    })

    it('clears the alert when a retry succeeds', async () => {
      signUpEmailMock.mockResolvedValueOnce({
        data: null,
        error: { code: 'USER_ALREADY_EXISTS', message: 'User already exists', status: 422 },
      })
      render(SignUpPage)
      await submitValidForm()
      await expect.element(page.getByRole('alert')).toBeInTheDocument()

      await page.getByRole('button', { name: 'Sign Up' }).click()
      await expect.element(page.getByRole('alert')).not.toBeInTheDocument()
    })
  })

  it('navigates to the app after a successful sign up', async () => {
    render(SignUpPage)
    await page.getByLabelText('Username').fill('valid_username')
    await page.getByLabelText('Email').fill('jeff@example.com')
    await page.getByLabelText('Password').fill('password123')
    await page.getByRole('button', { name: 'Sign Up' }).click()

    await vi.waitFor(() => {
      expect(gotoMock).toHaveBeenCalledWith('/app', { invalidateAll: true })
    })
  })
})
