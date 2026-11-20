// API integration tests (d-113): the app in process, with the fake adapter.
import {
  chatsOf,
  ErrorBody,
  MachineId,
  TranscriptResponse,
  WorkspaceLayout,
  WorkspacesResponse,
} from '@bridge/contract'
import type { InferResponseType } from 'hono/client'
import { describe, expect, expectTypeOf, it } from 'vitest'
import { createFakeAgents, fakeTranscript, fakeWorkspaces } from './adapters/fakeAgents.ts'
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

describe('GET /api/workspaces/:workspace/layout', () => {
  const layoutPath = (id: string) => `/api/workspaces/${encodeURIComponent(id)}/layout`

  it("returns a workspace's tabs, with a pane for each of its listed chats", async () => {
    const res = await createApp({ agents: createFakeAgents(machine), owner, log }).request(
      layoutPath(`${machine}/omni-brain`),
      { headers: local },
    )
    expect(res.status).toBe(200)
    const layout = WorkspaceLayout.parse(await res.json())
    const listed = fakeWorkspaces(machine)
      .find((w) => w.label === 'omni-brain')
      ?.chats.map((c) => c.id)
    expect(layout.tabs.flatMap((t) => chatsOf(t.root))).toEqual(listed)
  })

  it('answers 404 not-found for a workspace that the machine does not have, or one of another machine', async () => {
    const app = createApp({ agents: createFakeAgents(machine), owner, log })
    for (const id of [`${machine}/no-such-workspace`, 'laptop/omni-brain']) {
      const res = await app.request(layoutPath(id), { headers: local })
      expect(res.status).toBe(404)
      expect(ErrorBody.parse(await res.json()).error.kind).toBe('not-found')
    }
  })

  it('answers 400 invalid-input for an ID with no machine, and reads nothing', async () => {
    const agents = createFakeAgents(machine)
    const res = await createApp({ agents, owner, log }).request(layoutPath('omni-brain'), { headers: local })
    expect(res.status).toBe(400)
    expect(ErrorBody.parse(await res.json()).error.kind).toBe('invalid-input')
    expect(agents.reads()).toBe(0)
  })

  it('answers 503 herdr-unavailable when herdr does not answer, with no socket path in the body', async () => {
    const error = { reason: 'unreachable', message: 'herdr socket /home/dev/.config/herdr/herdr.sock: ENOENT' } as const
    const res = await createApp({ agents: createFakeAgents(machine, { error }), owner, log }).request(
      layoutPath(`${machine}/omni-brain`),
      { headers: local },
    )
    expect(res.status).toBe(503)
    const body = ErrorBody.parse(await res.json())
    expect(body.error.kind).toBe('herdr-unavailable')
    expect(JSON.stringify(body)).not.toContain('/home/dev')
  })

  it('refuses another Tailscale login before it reads', async () => {
    const agents = createFakeAgents(machine)
    const res = await createApp({ agents, owner, log }).request(layoutPath(`${machine}/omni-brain`), {
      headers: { ...tailnet, 'Tailscale-User-Login': 'someone@example.com' },
    })
    expect(res.status).toBe(403)
  })
})

describe('GET /api/chats/:chat/transcript', () => {
  const transcriptPath = (id: string) => `/api/chats/${encodeURIComponent(id)}/transcript`
  const themes = `${machine}/bridge-themes`

  it("returns the chat's last entries, reads only that chat and logs no transcript text", async () => {
    const logger = memoryLogger()
    const agents = createFakeAgents(machine)
    const res = await createApp({ agents, owner, log: logger.log }).request(transcriptPath(themes), { headers: local })
    expect(res.status).toBe(200)
    const body = TranscriptResponse.parse(await res.json())
    expect(body).toEqual({ chat: themes, ...fakeTranscript() })
    expect(agents.transcriptReads()).toEqual([themes])
    const logs = JSON.stringify(logger.lines())
    for (const entry of body.entries) if (entry.type !== 'tool') expect(logs).not.toContain(entry.text)
  })

  it('returns no entries for a shell chat', async () => {
    const res = await createApp({ agents: createFakeAgents(machine), owner, log }).request(
      transcriptPath(`${machine}/brain-git`),
      { headers: local },
    )
    expect(TranscriptResponse.parse(await res.json())).toEqual({
      chat: `${machine}/brain-git`,
      entries: [],
      earlier: false,
    })
  })

  it('answers 404 not-found for a chat that the machine does not have', async () => {
    const res = await createApp({ agents: createFakeAgents(machine), owner, log }).request(
      transcriptPath(`${machine}/no-such-chat`),
      { headers: local },
    )
    expect(res.status).toBe(404)
    expect(ErrorBody.parse(await res.json()).error.kind).toBe('not-found')
  })

  it('answers 400 invalid-input for an ID with no machine, and reads nothing', async () => {
    const agents = createFakeAgents(machine)
    const res = await createApp({ agents, owner, log }).request(transcriptPath('bridge-themes'), { headers: local })
    expect(res.status).toBe(400)
    expect(ErrorBody.parse(await res.json()).error.kind).toBe('invalid-input')
    expect(agents.transcriptReads()).toEqual([])
  })

  it('answers 503 herdr-unavailable when herdr does not answer, with no socket path in the body', async () => {
    const error = { reason: 'unreachable', message: 'herdr socket /home/dev/.config/herdr/herdr.sock: ENOENT' } as const
    const res = await createApp({ agents: createFakeAgents(machine, { error }), owner, log }).request(
      transcriptPath(themes),
      { headers: local },
    )
    expect(res.status).toBe(503)
    expect(JSON.stringify(ErrorBody.parse(await res.json()))).not.toContain('/home/dev')
  })

  it('refuses another Tailscale login before it reads', async () => {
    const agents = createFakeAgents(machine)
    const res = await createApp({ agents, owner, log }).request(transcriptPath(themes), {
      headers: { ...tailnet, 'Tailscale-User-Login': 'someone@example.com' },
    })
    expect(res.status).toBe(403)
    expect(agents.transcriptReads()).toEqual([])
  })
})

describe('the typed error responses', () => {
  it('gives the RPC client the ErrorBody of each error status of GET /api/workspaces/:workspace/layout', () => {
    type Get = Client['api']['workspaces'][':workspace']['layout']['$get']
    expectTypeOf<InferResponseType<Get, 404>>().toEqualTypeOf<ErrorBody>()
    expectTypeOf<InferResponseType<Get, 400>>().toEqualTypeOf<ErrorBody>()
    expectTypeOf<InferResponseType<Get, 503>>().toEqualTypeOf<ErrorBody>()
  })

  it('gives the RPC client the ErrorBody of each error status of GET /api/workspaces', () => {
    type Get = Client['api']['workspaces']['$get']
    expectTypeOf<InferResponseType<Get, 503>>().toEqualTypeOf<ErrorBody>()
    expectTypeOf<InferResponseType<Get, 502>>().toEqualTypeOf<ErrorBody>()
  })
})
