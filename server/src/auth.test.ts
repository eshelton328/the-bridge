import { describe, expect, it } from 'vitest'
import { access } from './auth.ts'

const from = (headers: Record<string, string>) => (name: string) =>
  Object.entries(headers).find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1]

describe('access', () => {
  it("lets in the owner's Tailscale login, in any case, with the Tailscale name", () => {
    expect(
      access(
        from({ 'Tailscale-User-Login': 'Owner@example.com', 'Tailscale-User-Name': 'Owner' }),
        'owner@example.com',
      ),
    ).toEqual({
      ok: true,
      who: 'Owner',
    })
  })

  it('refuses another login', () => {
    expect(access(from({ 'Tailscale-User-Login': 'other@example.com' }), 'owner@example.com').ok).toBe(false)
  })

  it('lets in localhost with no identity, but not through a proxy', () => {
    expect(access(from({ Host: 'localhost:5181' }), 'owner@example.com').ok).toBe(true)
    expect(access(from({ Host: '[::1]:5181' }), 'owner@example.com').ok).toBe(true)
    expect(access(from({ Host: 'localhost', 'X-Forwarded-For': '203.0.113.2' }), 'owner@example.com').ok).toBe(false)
    expect(access(from({ Host: 'mac.tailnet.example' }), 'owner@example.com').ok).toBe(false)
    expect(access(from({}), 'owner@example.com').ok).toBe(false)
  })
})
