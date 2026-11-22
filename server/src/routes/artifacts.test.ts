// API tests of /api/artifacts (R26, R27), in process with the fake agents, a
// store in memory and a finder that gives made-up artifacts.
import { ArtifactDetailResponse, ArtifactsResponse, ErrorBody, MachineId } from '@bridge/contract'
import { err, ok } from '@bridge/shared'
import { describe, expect, it } from 'vitest'
import { createFakeAgents } from '../adapters/fakeAgents.ts'
import { createApp } from '../app.ts'
import { memoryLogger } from '../logger.ts'
import { type ArtifactLibrary, type FoundArtifact, artifactIdOf, createArtifacts } from '../services/artifacts.ts'

const local = { Host: '127.0.0.1:5181' }
const json = { ...local, 'Content-Type': 'application/json' }
const link = (n: number) => `https://claude.ai/artifact/Example_Artifact-${String(n).padStart(4, '0')}`
const codexLink = 'https://example.com/marker-5150/site'

async function setup(options: { failing?: boolean } = {}) {
  const machine = MachineId.parse('test-mac')
  const agents = createFakeAgents(machine)
  const listed = await agents.listWorkspaces()
  const workspace = listed.ok ? listed.value[0] : undefined
  const chat = workspace?.chats[0]
  if (workspace === undefined || chat === undefined) throw new Error('the fake has no chat')
  let library: ArtifactLibrary = { lastSeenAt: null, artifacts: [] }
  const finds: FoundArtifact[][] = [
    [
      {
        link: link(1),
        title: 'Report 1',
        description: 'An example',
        publishedAt: '2026-11-20T10:00:00.000Z',
        // The fake chat's own session, so the detail finds the chat that made it.
        session: chat.id.slice(machine.length + 1),
        project: 'example-project',
      },
      {
        link: link(2),
        title: 'Report 2',
        description: '',
        publishedAt: '2026-11-20T11:00:00.000Z',
        session: '0b7f2c1e-4d3a-4f6b-9a8c-1e2d3c4b5a69',
        project: null,
      },
    ],
  ]
  const logger = memoryLogger()
  const artifacts = createArtifacts({
    store: {
      load: () => Promise.resolve(options.failing === true ? err({ reason: 'failed', code: 'EACCES' }) : ok(library)),
      save: (next) => {
        library = next
        return Promise.resolve(ok(undefined))
      },
    },
    finder: { scan: () => Promise.resolve({ found: finds.shift() ?? [], partial: false }) },
    machine,
  })
  const app = createApp({ agents, owner: 'owner@example.com', log: logger.log, artifacts })
  const send = (method: string, path: string, body?: unknown) =>
    app.request(`/api/artifacts${path}`, {
      method,
      headers: body === undefined ? local : json,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
  return { send, logger, chat, workspace }
}

describe('/api/artifacts', () => {
  it('lists the found artifacts newest first, and gives the detail with the chat that made it', async () => {
    const { send, chat, workspace } = await setup()
    const list = ArtifactsResponse.parse(await (await send('GET', '')).json())
    expect(list.artifacts.map((a) => a.link)).toEqual([link(2), link(1)])
    expect([list.partial, list.lastSeenAt]).toEqual([false, null])
    const id = artifactIdOf(link(1))
    const detail = ArtifactDetailResponse.parse(await (await send('GET', `/${id}`)).json())
    expect(detail.artifact.id).toBe(id)
    expect(detail.madeIn).toEqual({ chat: chat.id, workspace: workspace.id, title: chat.title, model: chat.model })
    const other = ArtifactDetailResponse.parse(await (await send('GET', `/${artifactIdOf(link(2))}`)).json())
    expect(other.madeIn).toBeNull()
  })

  it('adds an owner link (201), answers 200 for a link it has, files and removes it', async () => {
    const { send } = await setup()
    const request = { link: codexLink, source: 'codex', title: 'Example site' }
    const first = await send('POST', '', request)
    expect(first.status).toBe(201)
    const again = await send('POST', '', request)
    expect(again.status).toBe(200)
    const id = artifactIdOf(codexLink)
    expect((await send('PATCH', `/${id}`, { project: 'example-project' })).status).toBe(204)
    const filed = ArtifactDetailResponse.parse(await (await send('GET', `/${id}`)).json())
    expect([filed.artifact.project, filed.madeIn]).toEqual(['example-project', null])
    expect((await send('DELETE', `/${id}`)).status).toBe(204)
    expect((await send('GET', `/${id}`)).status).toBe(404)
    expect((await send('DELETE', `/${id}`)).status).toBe(404)
  })

  it('marks the library as seen', async () => {
    const { send } = await setup()
    expect((await send('POST', '/seen', {})).status).toBe(204)
    const list = ArtifactsResponse.parse(await (await send('GET', '')).json())
    expect(list.lastSeenAt).not.toBeNull()
  })

  it('refuses a bad ID, a Claude add off claude.ai, a link that is not https and a body that is not JSON', async () => {
    const { send } = await setup()
    expect((await send('GET', '/not-an-id')).status).toBe(400)
    expect((await send('PATCH', '/0123456789abcdef', { project: 'Bad Name' })).status).toBe(400)
    expect((await send('POST', '', { link: codexLink, source: 'claude', title: 'x' })).status).toBe(400)
    expect((await send('POST', '', { link: 'http://example.com/x', source: 'codex', title: 'x' })).status).toBe(400)
    const text = await send('POST', '/seen', undefined)
    expect(text.status).toBe(400)
    expect((await send('GET', '/0123456789abcdef')).status).toBe(404)
  })

  it('answers a store fault with 500, and logs its code but no link or title', async () => {
    const { send, logger } = await setup({ failing: true })
    const listed = await send('GET', '')
    expect(listed.status).toBe(500)
    expect(ErrorBody.parse(await listed.json()).error.kind).toBe('internal')
    expect((await send('POST', '', { link: codexLink, source: 'codex', title: 'Example site' })).status).toBe(500)
    const text = logger.text()
    expect(text).toContain('artifacts store failed')
    expect(text).toContain('EACCES')
    expect(text).not.toContain('marker-5150')
    expect(text).not.toContain('Example')
  })

  it('adds a link of the most characters the contract takes, also when each one takes 3 bytes', async () => {
    const { send } = await setup()
    const base = 'https://example.com/'
    const long = base + '中'.repeat(2048 - base.length)
    const added = await send('POST', '', { link: long, source: 'codex', title: '題'.repeat(200) })
    expect(added.status).toBe(201)
    const tooLong = await send('POST', '', { link: `${long}x`, source: 'codex', title: 'x' })
    expect(tooLong.status).toBe(400)
  })
})
