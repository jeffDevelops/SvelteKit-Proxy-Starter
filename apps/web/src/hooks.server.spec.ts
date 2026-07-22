import { handle } from './hooks.server'
import { afterEach, describe, expect, it, vi } from 'vitest'

const session = { id: 'session-id', userId: 'user-id' }
const user = { id: 'user-id', name: 'kalman' }

function makeEvent() {
  return {
    request: new Request('http://localhost/app/sign-in'),
    locals: {} as { session: unknown; user: unknown },
  }
}

const resolve = vi.fn(async () => new Response('ok'))

async function runHandle(event: ReturnType<typeof makeEvent>) {
  return handle({
    event: event as never,
    resolve: resolve as never,
  })
}

describe('handle', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('populates locals from the session endpoint', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ session, user })),
    )
    const event = makeEvent()
    await runHandle(event)

    expect(event.locals.session).toEqual(session)
    expect(event.locals.user).toEqual(user)
    expect(resolve).toHaveBeenCalled()
  })

  it('treats a non-ok session response as signed out', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('nope', { status: 401 })),
    )
    const event = makeEvent()
    await runHandle(event)

    expect(event.locals.session).toBeNull()
    expect(event.locals.user).toBeNull()
    expect(resolve).toHaveBeenCalled()
  })

  it('still serves the page as signed out when the API is unreachable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('ECONNREFUSED')
      }),
    )
    const event = makeEvent()
    const response = await runHandle(event)

    expect(event.locals.session).toBeNull()
    expect(event.locals.user).toBeNull()
    expect(await response.text()).toBe('ok')
  })
})
