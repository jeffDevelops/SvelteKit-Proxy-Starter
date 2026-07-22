// EmailProvider abstraction (architecture §10). Mailgun is the v1 adapter;
// no code outside an adapter may touch a vendor email API. All email content
// must stay SFW regardless of provider — notifications reference content,
// never include it.

export interface EmailMessage {
  to: string
  subject: string
  /** Plain-text body. Every message must have one. */
  text: string
  /** Optional HTML alternative. */
  html?: string
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<void>
}
