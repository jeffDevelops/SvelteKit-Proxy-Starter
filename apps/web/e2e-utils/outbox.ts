import { readdir, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// Where the e2e API instance's DevEmailProvider drops messages — must match
// EMAIL_OUTBOX_DIR in playwright.config.ts (relative to apps/api).
const OUTBOX_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../api/.e2e-outbox')

export interface OutboxMessage {
  sentAt: string
  to: string
  subject: string
  text: string
  html?: string
}

async function readOutbox(): Promise<OutboxMessage[]> {
  let files: string[]
  try {
    files = await readdir(OUTBOX_DIR)
  } catch {
    return [] // provider hasn't sent anything yet
  }
  // Filenames are prefixed with Date.now(), so sorting gives delivery order
  files.sort()
  return Promise.all(
    files.map(async (file) => JSON.parse(await readFile(join(OUTBOX_DIR, file), 'utf8'))),
  )
}

/**
 * Polls the outbox for the newest message to `recipient` (optionally matching
 * `subject`). Sends happen in the background on the API, so the first look
 * often races the write.
 */
export async function waitForEmailTo(
  recipient: string,
  { subject, timeoutMs = 15_000 }: { subject?: RegExp; timeoutMs?: number } = {},
): Promise<OutboxMessage> {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    const messages = (await readOutbox()).reverse().filter((message) => message.to === recipient)
    const match = subject ? messages.find((m) => subject.test(m.subject)) : messages[0]
    if (match) return match
    if (Date.now() > deadline) {
      throw new Error(
        `No email to ${recipient}${subject ? ` matching ${subject}` : ''} arrived within ${timeoutMs}ms`,
      )
    }
    await new Promise((r) => setTimeout(r, 250))
  }
}

/** First absolute URL in the message body — the verification/reset link. */
export function extractLink(message: OutboxMessage): string {
  const match = message.text.match(/https?:\/\/\S+/)
  if (!match) throw new Error(`No link found in email "${message.subject}"`)
  return match[0]
}
