import { describe, expect, it } from 'vitest'
import { describeUserAgent } from './user-agent'

// Coarse labels only — the sessions card answers "which of my devices is
// this?", not analytics-grade UA parsing.
describe('describeUserAgent', () => {
  it('labels desktop browsers with their OS', () => {
    expect(
      describeUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      ),
    ).toBe('Chrome on Windows')
    expect(
      describeUserAgent('Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0'),
    ).toBe('Firefox on Linux')
    expect(
      describeUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
      ),
    ).toBe('Safari on macOS')
  })

  it('distinguishes Chromium derivatives that embed Chrome in their UA', () => {
    expect(
      describeUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0',
      ),
    ).toBe('Edge on Windows')
  })

  it('labels mobile platforms', () => {
    expect(
      describeUserAgent(
        'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
      ),
    ).toBe('Chrome on Android')
    expect(
      describeUserAgent(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
      ),
    ).toBe('Safari on iOS')
  })

  it('falls back gracefully when the user agent is missing or unrecognizable', () => {
    expect(describeUserAgent(null)).toBe('Unknown device')
    expect(describeUserAgent(undefined)).toBe('Unknown device')
    expect(describeUserAgent('curl/8.5.0')).toBe('Unknown device')
  })
})
