import { describe, expect, it } from 'bun:test'
import { createEmailProvider } from './createEmailProvider'
import { DevEmailProvider } from './DevEmailProvider'
import { MailgunEmailProvider } from './MailgunEmailProvider'

const mailgunEnv = {
  MAILGUN_API_KEY: 'key-test',
  MAILGUN_DOMAIN: 'mg.example.com',
  EMAIL_FROM: 'auth-starter <no-reply@mg.example.com>',
}

describe('createEmailProvider', () => {
  it('returns the Mailgun provider when Mailgun is configured', () => {
    expect(createEmailProvider(mailgunEnv)).toBeInstanceOf(MailgunEmailProvider)
  })

  it('falls back to the dev outbox provider outside production', () => {
    expect(createEmailProvider({})).toBeInstanceOf(DevEmailProvider)
  })

  it('refuses to start in production without a real provider', () => {
    expect(() => createEmailProvider({ NODE_ENV: 'production' })).toThrow(/email/i)
  })

  it('rejects a partial Mailgun configuration instead of silently not sending', () => {
    expect(() => createEmailProvider({ MAILGUN_API_KEY: 'key-test' })).toThrow(/MAILGUN|EMAIL_FROM/)
    expect(() =>
      createEmailProvider({ MAILGUN_API_KEY: 'key-test', MAILGUN_DOMAIN: 'mg.x.com' }),
    ).toThrow(/EMAIL_FROM/)
  })
})
