import { describe, expect, it } from 'bun:test'
import { ACCOUNT_DELETED_PATH } from '@auth-starter/validation'
import { accountDeletedRedirect, deleteAccountEmail } from './account-deletion'

const user = { name: 'e2ejeff', email: 'jeff@example.com' }
const url = 'http://localhost:3000/api/auth/delete-user/callback?token=tok123&callbackURL=%2F'

describe('deleteAccountEmail', () => {
  it('addresses the account owner with the confirmation link', () => {
    const message = deleteAccountEmail(user, url)
    expect(message.to).toBe('jeff@example.com')
    expect(message.subject).toBe('Confirm deletion of your auth-starter account')
    expect(message.text).toContain(url)
    expect(message.text).toContain('e2ejeff')
  })

  it('tells non-requesters they can ignore it', () => {
    expect(deleteAccountEmail(user, url).text).toMatch(/didn.t request|ignore/i)
  })
})

describe('accountDeletedRedirect', () => {
  it('aborts the hard delete with a redirect to the deleted-account page', () => {
    const error = accountDeletedRedirect('http://localhost:4173')

    expect(error.statusCode).toBe(302)
    expect(error.headers?.get('location')).toBe(`http://localhost:4173${ACCOUNT_DELETED_PATH}`)
  })

  it('joins base URLs that carry a trailing slash', () => {
    const error = accountDeletedRedirect('http://localhost:4173/')
    expect(error.headers?.get('location')).toBe(`http://localhost:4173${ACCOUNT_DELETED_PATH}`)
  })
})
