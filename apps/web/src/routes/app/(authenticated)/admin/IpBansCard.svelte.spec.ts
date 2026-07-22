import { page } from 'vitest/browser'
import IpBansCard from './IpBansCard.svelte'
import { INVALID_IP_MESSAGE, IP_BAN_ADDED_MESSAGE, IP_BAN_REMOVED_MESSAGE } from '$lib/validation'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'

const ban = {
  id: 'ab34c5d6-0000-4000-8000-000000000001',
  ip: '203.0.113.9',
  reason: 'scraper',
  expiresAt: null,
}

const fetchMock = vi.fn()

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

function callsTo(method: string) {
  return fetchMock.mock.calls.filter(
    ([, init]) => ((init as RequestInit | undefined)?.method ?? 'GET') === method,
  )
}

describe('IpBansCard', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
    fetchMock.mockImplementation(async (_url: string, init?: RequestInit) => {
      if (!init?.method || init.method === 'GET') return jsonResponse([ban])
      return jsonResponse({ success: true }, init.method === 'POST' ? 201 : 200)
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('lists active bans with their scope', async () => {
    render(IpBansCard)

    await expect.element(page.getByText('203.0.113.9')).toBeInTheDocument()
    await expect.element(page.getByText('scraper · until lifted')).toBeInTheDocument()
  })

  it('adds a ban with reason and duration', async () => {
    render(IpBansCard)
    await page.getByLabelText('IP address').fill('198.51.100.7')
    await page.getByLabelText('Reason').fill('credential stuffing')
    await page.getByLabelText('Duration in days (leave empty for until lifted)').fill('30')
    await page.getByRole('button', { name: 'Ban IP' }).click()

    await expect.element(page.getByText(IP_BAN_ADDED_MESSAGE)).toBeInTheDocument()
    const [, init] = callsTo('POST')[0] ?? []
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      ip: '198.51.100.7',
      reason: 'credential stuffing',
      expiresInDays: 30,
    })
    // List refreshed after the mutation
    expect(callsTo('GET').length).toBeGreaterThan(1)
  })

  it('asks for a valid address when the API rejects the IP', async () => {
    fetchMock.mockImplementation(async (_url: string, init?: RequestInit) => {
      if (!init?.method || init.method === 'GET') return jsonResponse([])
      return jsonResponse({ error: 'Invalid IP ban', code: 'INVALID_IP_BAN', status: 400 }, 400)
    })
    render(IpBansCard)
    await page.getByLabelText('IP address').fill('not-an-ip')
    await page.getByRole('button', { name: 'Ban IP' }).click()

    await expect.element(page.getByText(INVALID_IP_MESSAGE)).toBeInTheDocument()
  })

  it('removes a ban', async () => {
    render(IpBansCard)
    await page.getByRole('button', { name: 'Remove ban on 203.0.113.9' }).click()

    await expect.element(page.getByText(IP_BAN_REMOVED_MESSAGE)).toBeInTheDocument()
    const [url] = callsTo('DELETE')[0] ?? []
    expect(String(url)).toContain(`/api/admin/ip-bans/${ban.id}`)
  })
})
