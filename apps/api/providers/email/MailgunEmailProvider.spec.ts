import { describe, expect, it } from 'bun:test'
import { MailgunEmailProvider } from './MailgunEmailProvider'

function capture(status = 200) {
  const calls: { url: string; init: RequestInit }[] = []
  const fetchFn: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init: init ?? {} })
    return new Response(status === 200 ? '{"id":"<x>"}' : 'nope', { status })
  }
  const call = (index: number) => {
    const captured = calls.at(index)
    if (!captured) throw new Error(`no fetch call captured at index ${index}`)
    return captured
  }
  return { calls, call, fetchFn }
}

const opts = {
  apiKey: 'key-test',
  domain: 'mg.example.com',
  from: 'auth-starter <no-reply@mg.example.com>',
}

describe('MailgunEmailProvider', () => {
  it('POSTs the message to the Mailgun messages endpoint with basic auth', async () => {
    const { calls, call, fetchFn } = capture()
    const provider = new MailgunEmailProvider(opts, fetchFn)

    await provider.send({
      to: 'someone@example.com',
      subject: 'Reset your password',
      text: 'link here',
    })

    expect(calls).toHaveLength(1)
    expect(call(0).url).toBe('https://api.mailgun.net/v3/mg.example.com/messages')
    expect(call(0).init.method).toBe('POST')
    const auth = new Headers(call(0).init.headers).get('authorization')
    expect(auth).toBe(`Basic ${btoa('api:key-test')}`)

    const form = call(0).init.body as FormData
    expect(form.get('from')).toBe(opts.from)
    expect(form.get('to')).toBe('someone@example.com')
    expect(form.get('subject')).toBe('Reset your password')
    expect(form.get('text')).toBe('link here')
    expect(form.get('html')).toBeNull()
  })

  it('includes html when provided', async () => {
    const { call, fetchFn } = capture()
    const provider = new MailgunEmailProvider(opts, fetchFn)

    await provider.send({ to: 'a@b.co', subject: 's', text: 't', html: '<p>t</p>' })

    const form = call(0).init.body as FormData
    expect(form.get('html')).toBe('<p>t</p>')
  })

  it('honors a custom base URL (EU region)', async () => {
    const { call, fetchFn } = capture()
    const provider = new MailgunEmailProvider(
      { ...opts, baseUrl: 'https://api.eu.mailgun.net' },
      fetchFn,
    )

    await provider.send({ to: 'a@b.co', subject: 's', text: 't' })

    expect(call(0).url).toBe('https://api.eu.mailgun.net/v3/mg.example.com/messages')
  })

  it('throws on a non-2xx response without leaking the API key', async () => {
    const { fetchFn } = capture(401)
    const provider = new MailgunEmailProvider(opts, fetchFn)

    const promise = provider.send({ to: 'a@b.co', subject: 's', text: 't' })

    expect(promise).rejects.toThrow(/mailgun/i)
    try {
      await promise
    } catch (error) {
      expect(String(error)).not.toContain('key-test')
    }
  })
})
