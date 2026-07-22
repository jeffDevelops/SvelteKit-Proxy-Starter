// TTL-cached membership check for the banned-IP middleware: the auth hot
// path must not pay a database round trip per request, and a ban list is
// tiny. Mutating routes call invalidate() so new bans apply immediately.
export function createIpBanChecker(loadActive: () => Promise<string[]>, ttlMs = 30_000) {
  let ips = new Set<string>()
  let fetchedAt = 0
  let inflight: Promise<void> | null = null

  const refresh = async () => {
    try {
      ips = new Set(await loadActive())
    } catch {
      // Fail open with stale data — a database blip must not lock out the
      // whole site over an advisory control.
    }
    fetchedAt = Date.now()
  }

  return {
    async isBanned(ip: string): Promise<boolean> {
      if (Date.now() - fetchedAt >= ttlMs) {
        inflight ??= refresh().finally(() => {
          inflight = null
        })
        await inflight
      }
      return ips.has(ip)
    },
    invalidate() {
      fetchedAt = 0
    },
  }
}
