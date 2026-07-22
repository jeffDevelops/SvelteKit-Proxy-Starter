import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { RequestEvent } from '@sveltejs/kit'
import { GET, POST } from './+server'

vi.mock('$env/static/private', () => ({ API_HOST: 'api.internal:3000' }))

const CLIENT_ADDRESS = '198.51.100.7'

function makeEvent(init?: { headers?: Record<string, string>; method?: string }) {
  const method = init?.method ?? 'GET'
  const request = new Request('http://localhost:4173/api/auth/sign-in/email?token=abc', {
    method,
    headers: init?.headers,
    body: method === 'GET' ? undefined : JSON.stringify({ email: 'a@example.com' }),
  })
  return {
    request,
    params: { path: 'sign-in/email' },
    url: new URL(request.url),
    getClientAddress: () => CLIENT_ADDRESS,
  } as unknown as RequestEvent
}

function sentHeaders(fetchMock: ReturnType<typeof vi.fn>): Headers {
  const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
  return new Headers(init.headers)
}

describe('auth proxy IP forwarding', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn(async () => new Response('{}'))
    vi.stubGlobal('fetch', fetchMock)
  })

  it('sets x-forwarded-for to the connection address the proxy observed', async () => {
    await GET(makeEvent())
    expect(sentHeaders(fetchMock).get('x-forwarded-for')).toBe(CLIENT_ADDRESS)
  })

  it('overwrites a client-supplied x-forwarded-for so per-IP rate limits cannot be spoofed', async () => {
    await POST(
      makeEvent({
        method: 'POST',
        headers: { 'x-forwarded-for': '6.6.6.6, 7.7.7.7' },
      }),
    )
    expect(sentHeaders(fetchMock).get('x-forwarded-for')).toBe(CLIENT_ADDRESS)
  })

  it('still forwards the remaining request headers', async () => {
    await GET(makeEvent({ headers: { cookie: 'better-auth.session_token=abc' } }))
    expect(sentHeaders(fetchMock).get('cookie')).toBe('better-auth.session_token=abc')
  })

  it('keeps the query string and manual redirect handling', async () => {
    await GET(makeEvent())
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('http://api.internal:3000/api/auth/sign-in/email?token=abc')
    expect(init.redirect).toBe('manual')
  })
})
