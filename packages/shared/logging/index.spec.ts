import { describe, expect, it } from 'bun:test'
import { createConsoleLogger, redactSecrets } from './index'

function capture(level?: 'debug' | 'info' | 'warn' | 'error') {
  const lines: string[] = []
  const logger = createConsoleLogger({ level, write: (line) => lines.push(line) })
  return { lines, logger, last: () => JSON.parse(lines[lines.length - 1] ?? '{}') }
}

describe('createConsoleLogger', () => {
  it('emits one JSON line with level, message, and timestamp', () => {
    const { logger, last, lines } = capture()
    logger.info('api listening', { port: 3000 })

    expect(lines).toHaveLength(1)
    const entry = last()
    expect(entry.level).toBe('info')
    expect(entry.message).toBe('api listening')
    expect(entry.port).toBe(3000)
    expect(new Date(entry.time).getTime()).not.toBeNaN()
  })

  it('suppresses entries below the configured level', () => {
    const { logger, lines } = capture('warn')
    logger.debug('noise')
    logger.info('noise')
    logger.warn('kept')
    logger.error('kept')

    expect(lines).toHaveLength(2)
  })

  it('defaults to info', () => {
    const { logger, lines } = capture()
    logger.debug('noise')
    logger.info('kept')

    expect(lines).toHaveLength(1)
  })

  it('merges child fields into every line', () => {
    const { logger, last } = capture()
    const child = logger.child({ requestId: 'req-1' })
    child.info('handled', { status: 200 })

    expect(last().requestId).toBe('req-1')
    expect(last().status).toBe(200)
  })

  it('never writes secret-looking fields, even nested', () => {
    const { logger, last } = capture()
    logger.error('mailgun send failed', {
      config: { MAILGUN_API_KEY: 'key-abc123', domain: 'mail.example.com' },
      headers: [{ authorization: 'Bearer xyz' }],
    })

    const line = JSON.stringify(last())
    expect(line).not.toContain('key-abc123')
    expect(line).not.toContain('Bearer xyz')
    expect(last().config.domain).toBe('mail.example.com')
    expect(last().config.MAILGUN_API_KEY).toBe('[redacted]')
  })
})

describe('redactSecrets', () => {
  it('redacts by key name, case-insensitively', () => {
    const redacted = redactSecrets({
      password: 'hunter2',
      Token: 'tok',
      apiKey: 'k',
      sessionCookie: 'c',
      safe: 'ok',
    })
    expect(redacted).toEqual({
      password: '[redacted]',
      Token: '[redacted]',
      apiKey: '[redacted]',
      sessionCookie: '[redacted]',
      safe: 'ok',
    })
  })

  it('survives circular structures without throwing', () => {
    const fields: Record<string, unknown> = { name: 'loop' }
    fields.self = fields
    expect(() => redactSecrets(fields)).not.toThrow()
  })
})
