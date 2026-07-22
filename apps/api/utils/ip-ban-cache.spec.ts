import { describe, expect, it } from 'bun:test'
import { createIpBanChecker } from './ip-ban-cache'

describe('createIpBanChecker', () => {
  it('answers from the loaded ban list', async () => {
    const checker = createIpBanChecker(async () => ['203.0.113.7'])

    expect(await checker.isBanned('203.0.113.7')).toBe(true)
    expect(await checker.isBanned('198.51.100.1')).toBe(false)
  })

  it('caches within the TTL instead of reloading per request', async () => {
    let loads = 0
    const checker = createIpBanChecker(async () => {
      loads += 1
      return []
    }, 60_000)

    await checker.isBanned('203.0.113.7')
    await checker.isBanned('203.0.113.8')
    expect(loads).toBe(1)
  })

  it('collapses concurrent refreshes into one load', async () => {
    let loads = 0
    const checker = createIpBanChecker(async () => {
      loads += 1
      await new Promise((resolve) => setTimeout(resolve, 10))
      return []
    })

    await Promise.all([checker.isBanned('a'), checker.isBanned('b'), checker.isBanned('c')])
    expect(loads).toBe(1)
  })

  it('reloads immediately after invalidate — a new ban applies without waiting out the TTL', async () => {
    let list: string[] = []
    const checker = createIpBanChecker(async () => list, 60_000)

    expect(await checker.isBanned('203.0.113.7')).toBe(false)
    list = ['203.0.113.7']
    checker.invalidate()
    expect(await checker.isBanned('203.0.113.7')).toBe(true)
  })

  it('fails open when the loader throws — an outage must not lock everyone out', async () => {
    let shouldFail = false
    const checker = createIpBanChecker(async () => {
      if (shouldFail) throw new Error('db down')
      return ['203.0.113.7']
    }, 0)

    expect(await checker.isBanned('203.0.113.7')).toBe(true)
    shouldFail = true
    // Stale data keeps serving; unknown addresses stay allowed
    expect(await checker.isBanned('203.0.113.7')).toBe(true)
    expect(await checker.isBanned('198.51.100.1')).toBe(false)
  })
})
