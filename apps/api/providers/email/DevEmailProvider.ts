/* oxlint-disable no-console -- console IS this adapter's dev-facing output */
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { EmailMessage, EmailProvider } from '@auth-starter/email'

// Local-development adapter: drops every message into an outbox directory as
// a JSON file instead of sending it. Playwright e2e reads the outbox to walk
// verification/reset links. Only recipient + subject go to the console —
// bodies carry reset/verify tokens, which are credentials and stay unlogged.
export class DevEmailProvider implements EmailProvider {
  constructor(private readonly outboxDir: string) {}

  async send(message: EmailMessage): Promise<void> {
    await mkdir(this.outboxDir, { recursive: true })
    const file = join(this.outboxDir, `${Date.now()}-${crypto.randomUUID()}.json`)
    await writeFile(file, JSON.stringify({ sentAt: new Date().toISOString(), ...message }, null, 2))
    console.info(`[email:dev] to=${message.to} subject="${message.subject}" → ${file}`)
  }
}
