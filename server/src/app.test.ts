// API integration tests (d-113): the app in process, with the fake adapter.
import { MachineId, WorkspacesResponse } from '@bridge/contract'
import { describe, expect, it } from 'vitest'
import { createFakeAgents, fakeWorkspaces } from './adapters/fakeAgents.ts'
import { createApp } from './app.ts'
import { memoryLogger } from './logger.ts'

const machine = MachineId.parse('test-mac')
const owner = 'owner@example.com'
const { log } = memoryLogger()
const local = { Host: '127.0.0.1:5181' }
const tailnet = { Host: 'mac.tailnet.example', 'X-Forwarded-For': '203.0.113.2' }

describe('GET /api/workspaces', () => {
  it('returns the workspaces and their chats to the owner on the tailnet', async () => {
    const app = createApp({ agents: createFakeAgents(machine), owner, log })
    const res = await app.request('/api/workspaces', {
      headers: { ...tailnet, 'Tailscale-User-Login': 'Owner@Example.com' },
    })
    expect(res.status).toBe(200)
    expect(WorkspacesResponse.parse(await res.json())).toEqual({ machine, workspaces: fakeWorkspaces(machine) })
  })

  it('returns them to a browser on this computer with no proxy', async () => {
    const res = await createApp({ agents: createFakeAgents(machine), owner, log }).request('/api/workspaces', {
      headers: local,
    })
    expect(res.status).toBe(200)
  })

  it('refuses another Tailscale login, a proxied request with no login and an unknown host', async () => {
    const agents = createFakeAgents(machine)
    const app = createApp({ agents, owner, log })
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
    const res = await createApp({ agents, owner, log }).request('/api/workspaces', { headers: local })
    expect(res.status).toBe(502)
    expect(await res.json()).toEqual({ error: 'herdr socket: ENOENT', reason: 'unreachable' })
  })

  it('reads nothing from the agents until a client asks', async () => {
    const agents = createFakeAgents(machine)
    const app = createApp({ agents, owner, log })
    expect(agents.reads()).toBe(0)
    await app.request('/api/workspaces', { headers: local })
    expect(agents.reads()).toBe(1)
  })

  it('answers 404 for a path it does not have', async () => {
    const res = await createApp({ agents: createFakeAgents(machine), owner, log }).request('/api/nothing', {
      headers: local,
    })
    expect(res.status).toBe(404)
  })
})

describe('request IDs and the request log', () => {
  it('gives each response an X-Request-Id and logs one line with the same ID, the status and the time', async () => {
    const logger = memoryLogger()
    const app = createApp({ agents: createFakeAgents(machine), owner, log: logger.log })
    const res = await app.request('/api/workspaces', { headers: local })
    const id = res.headers.get('X-Request-Id')
    expect(id).toMatch(/^[\w-]{8,}$/)
    const [entry, ...more] = logger.lines()
    expect(more).toEqual([])
    const { time, ms, ...rest } = entry ?? {}
    expect(typeof time).toBe('string')
    expect(typeof ms).toBe('number')
    expect(rest).toEqual({
      level: 30,
      msg: 'request',
      requestId: id,
      method: 'GET',
      path: '/api/workspaces',
      status: 200,
    })
  })

  it('gives a refused request an ID too, and keeps the Tailscale login out of the log', async () => {
    const logger = memoryLogger()
    const app = createApp({ agents: createFakeAgents(machine), owner, log: logger.log })
    const res = await app.request('/api/workspaces', {
      headers: { ...tailnet, 'Tailscale-User-Login': 'someone@example.com' },
    })
    expect(res.status).toBe(403)
    expect(res.headers.get('X-Request-Id')).not.toBeNull()
    expect(logger.lines().map((e) => e.status)).toEqual([403])
    expect(JSON.stringify(logger.lines())).not.toContain('someone@example.com')
  })
})
