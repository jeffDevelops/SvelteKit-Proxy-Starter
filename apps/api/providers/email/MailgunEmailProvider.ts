import type { EmailMessage, EmailProvider } from '@auth-starter/email'

export interface MailgunOptions {
  apiKey: string
  domain: string
  /** RFC 5322 sender, e.g. `auth-starter <no-reply@mg.example.com>` */
  from: string
  /** Override for the EU region (`https://api.eu.mailgun.net`). */
  baseUrl?: string
}

// The only code allowed to talk to the Mailgun API (architecture §10).
export class MailgunEmailProvider implements EmailProvider {
  constructor(
    private readonly options: MailgunOptions,
    private readonly fetchFn: typeof fetch = fetch,
  ) {}

  async send(message: EmailMessage): Promise<void> {
    const { apiKey, domain, from, baseUrl = 'https://api.mailgun.net' } = this.options

    const form = new FormData()
    form.set('from', from)
    form.set('to', message.to)
    form.set('subject', message.subject)
    form.set('text', message.text)
    if (message.html) form.set('html', message.html)

    const response = await this.fetchFn(`${baseUrl}/v3/${domain}/messages`, {
      method: 'POST',
      headers: { authorization: `Basic ${btoa(`api:${apiKey}`)}` },
      body: form,
    })

    if (!response.ok) {
      // Status only — the response body can echo request details and the
      // recipient address doesn't belong in logs either.
      throw new Error(`Mailgun send failed with status ${response.status}`)
    }
  }
}
