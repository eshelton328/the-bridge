// API integration tests (d-113): the app in process, with the fake adapter.
import { MachineId, WorkspacesResponse } from '@bridge/contract'
import { describe, expect, it } from 'vitest'
import { createFakeAgents, fakeWorkspaces } from './adapters/fakeAgents.ts'
import { createApp } from './app.ts'

const machine = MachineId.parse('test-mac')
const owner = 'owner@example.com'
const local = { Host: '127.0.0.1:5181' }
const tailnet = { Host: 'mac.tailnet.example', 'X-Forwarded-For': '203.0.113.2' }

describe('GET /api/workspaces', () => {
  it('returns the workspaces and their chats to the owner on the tailnet', async () => {
    const app = createApp({ agents: createFakeAgents(machine), owner })
    const res = await app.request('/api/workspaces', {
      headers: { ...tailnet, 'Tailscale-User-Login': 'Owner@Example.com' },
    })
    expect(res.status).toBe(200)
    expect(WorkspacesResponse.parse(await res.json())).toEqual({ machine, workspaces: fakeWorkspaces(machine) })
  })

  it('returns them to a browser on this computer with no proxy', async () => {
    const res = await createApp({ agents: createFakeAgents(machine), owner }).request('/api/workspaces', {
      headers: local,
    })
    expect(res.status).toBe(200)
  })

  it('refuses another Tailscale login, a proxied request with no login and an unknown host', async () => {
    const agents = createFakeAgents(machine)
    const app = createApp({ agents, owner })
    const refused = [
      { ...tailnet, 'Tailscale-User-Login': 'someone@example.com' },
      tailnet,
      { ...local, 'X-Forwarded-Host': 'example.com' },
      { Host: 'example.com' },
      {},
    ]
    for (const headers of refused) {
      const res = await app.request('/api/workspaces', { headers })
      expect(res.status).toBe(403)
      expect(await res.json()).toHaveProperty('error')
    }
    expect(agents.reads()).toBe(0)
  })

  it('answers 502 with the reason when the agents do not answer', async () => {
    const agents = createFakeAgents(machine, { error: { reason: 'unreachable', message: 'herdr socket: ENOENT' } })
    const res = await createApp({ agents, owner }).request('/api/workspaces', { headers: local })
    expect(res.status).toBe(502)
    expect(await res.json()).toEqual({ error: 'herdr socket: ENOENT', reason: 'unreachable' })
  })

  it('reads nothing from the agents until a client asks', async () => {
    const agents = createFakeAgents(machine)
    const app = createApp({ agents, owner })
    expect(agents.reads()).toBe(0)
    await app.request('/api/workspaces', { headers: local })
    expect(agents.reads()).toBe(1)
  })

  it('answers 404 for a path it does not have', async () => {
    const res = await createApp({ agents: createFakeAgents(machine), owner }).request('/api/nothing', {
      headers: local,
    })
    expect(res.status).toBe(404)
  })
})
