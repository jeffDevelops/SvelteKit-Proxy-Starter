import type { EmailProvider } from '@auth-starter/email'
import { DevEmailProvider } from './DevEmailProvider'
import { MailgunEmailProvider } from './MailgunEmailProvider'

export interface EmailProviderEnv {
  NODE_ENV?: string
  MAILGUN_API_KEY?: string
  MAILGUN_DOMAIN?: string
  MAILGUN_BASE_URL?: string
  EMAIL_FROM?: string
  EMAIL_OUTBOX_DIR?: string
}

export function createEmailProvider(env: EmailProviderEnv): EmailProvider {
  const { MAILGUN_API_KEY, MAILGUN_DOMAIN, EMAIL_FROM } = env

  if (MAILGUN_API_KEY && !MAILGUN_DOMAIN)
    throw new Error('MAILGUN_API_KEY is set but MAILGUN_DOMAIN is not')
  if (MAILGUN_API_KEY && !EMAIL_FROM)
    throw new Error('MAILGUN_API_KEY is set but EMAIL_FROM is not')

  if (MAILGUN_API_KEY && MAILGUN_DOMAIN && EMAIL_FROM) {
    return new MailgunEmailProvider({
      apiKey: MAILGUN_API_KEY,
      domain: MAILGUN_DOMAIN,
      from: EMAIL_FROM,
      baseUrl: env.MAILGUN_BASE_URL,
    })
  }

  // Auth emails (verification, password reset) are load-bearing — a prod
  // deploy with no way to send them is a misconfiguration, not a fallback.
  if (env.NODE_ENV === 'production') {
    throw new Error('No email provider configured — set the MAILGUN_* variables in production')
  }

  return new DevEmailProvider(env.EMAIL_OUTBOX_DIR ?? '.email-outbox')
}
