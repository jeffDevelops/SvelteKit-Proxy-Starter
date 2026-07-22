import { afterEach, describe, expect, it } from 'bun:test'
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DevEmailProvider } from './DevEmailProvider'

const dirs: string[] = []

function outboxDir() {
  const dir = mkdtempSync(join(tmpdir(), 'sc-outbox-'))
  dirs.push(dir)
  return dir
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('DevEmailProvider', () => {
  it('writes each message as a JSON file in the outbox directory', async () => {
    const dir = outboxDir()
    const provider = new DevEmailProvider(dir)

    await provider.send({
      to: 'someone@example.com',
      subject: 'Verify your email',
      text: 'Click: https://example.com/verify?token=abc',
    })

    const files = readdirSync(dir)
    expect(files).toHaveLength(1)
    const message = JSON.parse(readFileSync(join(dir, files[0] ?? ''), 'utf8'))
    expect(message.to).toBe('someone@example.com')
    expect(message.subject).toBe('Verify your email')
    expect(message.text).toContain('token=abc')
  })

  it('creates the outbox directory if it does not exist', async () => {
    const dir = join(outboxDir(), 'nested', 'outbox')
    const provider = new DevEmailProvider(dir)

    await provider.send({ to: 'a@example.com', subject: 's', text: 't' })

    expect(readdirSync(dir)).toHaveLength(1)
  })

  it('never overwrites earlier messages', async () => {
    const dir = outboxDir()
    const provider = new DevEmailProvider(dir)

    await provider.send({ to: 'a@example.com', subject: 'first', text: '1' })
    await provider.send({ to: 'a@example.com', subject: 'second', text: '2' })

    expect(readdirSync(dir)).toHaveLength(2)
  })
})
