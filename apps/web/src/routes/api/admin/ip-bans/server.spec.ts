import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, POST } from './+server'

const { getMock, postMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
}))

vi.mock('$lib/server/api', () => ({
  api: { api: { 'ip-bans': { $get: getMock, $post: postMock } } },
}))

const admin = { id: 'u-admin', role: 'admin' }
const CALLER_ADDRESS = '198.51.100.7'

function makeEvent(overrides: Record<string, unknown> = {}) {
  return {
    locals: { session: { id: 's-1' }, user: admin },
    getClientAddress: () => CALLER_ADDRESS,
    request: new Request('http://localhost/api/admin/ip-bans', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ip: '203.0.113.9', reason: 'scraper' }),
    }),
    ...overrides,
  }
}

async function statusOfThrown(run: () => Promise<unknown>) {
  try {
    await run()
    return null
  } catch (thrown) {
    return (thrown as { status?: number }).status ?? null
  }
}

describe('/api/admin/ip-bans', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getMock.mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }))
    postMock.mockResolvedValue(new Response(JSON.stringify({ id: 'ban-1' }), { status: 201 }))
  })

  it('rejects unauthenticated callers', async () => {
    // oxlint-disable-next-line no-explicit-any
    const event = makeEvent({ locals: { session: null, user: null } }) as any
    expect(await statusOfThrown(() => GET(event))).toBe(401)
    expect(await statusOfThrown(() => POST(event))).toBe(401)
  })

  it('rejects signed-in non-admins', async () => {
    const locals = { session: { id: 's-1' }, user: { id: 'u-1', role: 'user' } }
    // oxlint-disable-next-line no-explicit-any
    const event = makeEvent({ locals }) as any
    expect(await statusOfThrown(() => GET(event))).toBe(403)
    expect(await statusOfThrown(() => POST(event))).toBe(403)
    expect(postMock).not.toHaveBeenCalled()
  })

  it('refuses to ban the address the admin is connecting from', async () => {
    const event = makeEvent({
      request: new Request('http://localhost/api/admin/ip-bans', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ip: CALLER_ADDRESS, reason: 'oops' }),
      }),
    })
    // oxlint-disable-next-line no-explicit-any
    const response = (await POST(event as any)) as Response

    expect(response.status).toBe(400)
    expect((await response.json()).code).toBe('CANNOT_BAN_OWN_IP')
    expect(postMock).not.toHaveBeenCalled()
  })

  it('forwards other bans to the API', async () => {
    // oxlint-disable-next-line no-explicit-any
    const response = (await POST(makeEvent() as any)) as Response

    expect(postMock).toHaveBeenCalledWith({ json: { ip: '203.0.113.9', reason: 'scraper' } })
    expect(response.status).toBe(201)
    expect((await response.json()).id).toBe('ban-1')
  })
})
