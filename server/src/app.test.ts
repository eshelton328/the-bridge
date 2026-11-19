// API integration tests (d-113): the app in process, with the fake adapter.
import { ErrorBody, MachineId, WorkspacesResponse } from '@bridge/contract'
import type { InferResponseType } from 'hono/client'
import { describe, expect, expectTypeOf, it } from 'vitest'
import { createFakeAgents, fakeWorkspaces } from './adapters/fakeAgents.ts'
import { createApp } from './app.ts'
import type { Client } from './client.ts'
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
      const body = ErrorBody.parse(await res.json())
      expect(body.error.kind).toBe('forbidden')
      expect(body.error.requestId).toBe(res.headers.get('X-Request-Id'))
      expect(JSON.stringify(body)).not.toContain('someone@example.com')
    }
    expect(agents.reads()).toBe(0)
  })

  it('answers 503 herdr-unavailable when herdr does not answer, with no socket path in the body', async () => {
    const logger = memoryLogger()
    const error = { reason: 'unreachable', message: 'herdr socket /home/dev/.config/herdr/herdr.sock: ENOENT' } as const
    const res = await createApp({ agents: createFakeAgents(machine, { error }), owner, log: logger.log }).request(
      '/api/workspaces',
      { headers: local },
    )
    expect(res.status).toBe(503)
    const requestId = res.headers.get('X-Request-Id')
    expect(await res.json()).toEqual({
      error: { kind: 'herdr-unavailable', message: 'herdr does not answer', requestId },
    })
    // The path stays in the server's log.
    expect(logger.lines()).toContainEqual(expect.objectContaining({ msg: 'herdr call failed', detail: error.message }))
  })

  it('answers 502 herdr-bad-reply when herdr answers with something the server does not read', async () => {
    const error = { reason: 'badReply', message: 'herdr agent.list: unknown shape' } as const
    const res = await createApp({ agents: createFakeAgents(machine, { error }), owner, log }).request(
      '/api/workspaces',
      { headers: local },
    )
    expect(res.status).toBe(502)
    expect(ErrorBody.parse(await res.json()).error.kind).toBe('herdr-bad-reply')
  })

  it('answers 500 internal with the request ID and logs the thrown error once, with its message only there', async () => {
    const logger = memoryLogger()
    const agents = { ...createFakeAgents(machine), listWorkspaces: () => Promise.reject(new Error('lost /home/dev/x')) }
    const res = await createApp({ agents, owner, log: logger.log }).request('/api/workspaces', { headers: local })
    expect(res.status).toBe(500)
    const requestId = res.headers.get('X-Request-Id')
    const body = ErrorBody.parse(await res.json())
    expect(body.error).toMatchObject({ kind: 'internal', requestId })
    expect(JSON.stringify(body)).not.toContain('/home/dev/x')
    const errors = logger.lines().filter((e) => e.msg === 'route error')
    expect(errors).toHaveLength(1)
    expect(errors[0]?.requestId).toBe(requestId)
    expect(JSON.stringify(errors[0]?.err)).toContain('lost /home/dev/x')
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
    expect(ErrorBody.parse(await res.json()).error).toMatchObject({ kind: 'not-found', path: '/api/nothing' })
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
    expect(
      logger
        .lines()
        .filter((e) => e.msg === 'request')
        .map((e) => e.status),
    ).toEqual([403])
    expect(
      logger
        .lines()
        .filter((e) => e.msg === 'request refused')
        .map((e) => e.reason),
    ).toEqual(['notOwner'])
    expect(JSON.stringify(logger.lines())).not.toContain('someone@example.com')
  })
})

describe('the typed error responses', () => {
  it('gives the RPC client the ErrorBody of each error status of GET /api/workspaces', () => {
    type Get = Client['api']['workspaces']['$get']
    expectTypeOf<InferResponseType<Get, 503>>().toEqualTypeOf<ErrorBody>()
    expectTypeOf<InferResponseType<Get, 502>>().toEqualTypeOf<ErrorBody>()
  })
})
