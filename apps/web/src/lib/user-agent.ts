// Coarse, dependency-free device label for the sessions card. Order matters:
// most UA strings embed their ancestors' tokens (Edge contains "Chrome",
// Chrome contains "Safari", Android contains "Linux", iOS contains "like Mac
// OS X"), so the most specific token must win.
export function describeUserAgent(userAgent?: string | null): string {
  if (!userAgent) return 'Unknown device'

  const browser = userAgent.includes('Edg/')
    ? 'Edge'
    : userAgent.includes('OPR/') || userAgent.includes('Opera')
      ? 'Opera'
      : userAgent.includes('Firefox/')
        ? 'Firefox'
        : userAgent.includes('Chrome/')
          ? 'Chrome'
          : userAgent.includes('Safari/')
            ? 'Safari'
            : null

  const os = userAgent.includes('Windows')
    ? 'Windows'
    : userAgent.includes('Android')
      ? 'Android'
      : userAgent.includes('iPhone') || userAgent.includes('iPad')
        ? 'iOS'
        : userAgent.includes('Macintosh') || userAgent.includes('Mac OS X')
          ? 'macOS'
          : userAgent.includes('Linux')
            ? 'Linux'
            : null

  if (!browser && !os) return 'Unknown device'
  if (!browser) return `Unknown browser on ${os}`
  if (!os) return browser
  return `${browser} on ${os}`
}
