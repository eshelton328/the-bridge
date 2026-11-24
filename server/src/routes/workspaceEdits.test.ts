// API tests of the edit routes (R41, R42): rename a workspace and a chat, and
// the owner's order of the workspaces, with the fake adapter (d-113).
import { CreateWorkspaceResponse, ErrorBody, MachineId, WorkspacesResponse } from '@bridge/contract'
import { describe, expect, it } from 'vitest'
import { createFakeAgents } from '../adapters/fakeAgents.ts'
import { createApp } from '../app.ts'
import { memoryLogger } from '../logger.ts'

const machine = MachineId.parse('test-mac')
const owner = 'owner@example.com'
const json = { Host: '127.0.0.1:5181', 'Content-Type': 'application/json' }

function setup() {
  const agents = createFakeAgents(machine)
  const app = createApp({ agents, owner, log: memoryLogger().log })
  const post = (path: string, body: unknown) =>
    app.request(path, { method: 'POST', headers: json, body: JSON.stringify(body) })
  const list = async () =>
    WorkspacesResponse.parse(await (await app.request('/api/workspaces', { headers: json })).json())
  return { agents, post, list }
}

describe('the edit routes', () => {
  it('makes a workspace named "untitled" by default and lists it, 400 for a bad name or a path (W4)', async () => {
    const { post, list } = setup()
    const first = await post('/api/workspaces', {})
    expect(first.status).toBe(201)
    const made = CreateWorkspaceResponse.parse(await first.json()).workspace
    expect(made.label).toBe('untitled')
    expect(made.chats.map((c) => c.kind)).toEqual(['shell'])
    const named = CreateWorkspaceResponse.parse(await (await post('/api/workspaces', { name: ' loops ' })).json())
    expect(named.workspace.label).toBe('loops')
    expect((await list()).workspaces.map((w) => w.id)).toEqual(expect.arrayContaining([made.id, named.workspace.id]))
    expect((await post('/api/workspaces', { name: '' })).status).toBe(400)
    expect((await post('/api/workspaces', { cwd: '/home/dev' })).status).toBe(400)
  })

  it('renames a workspace and a chat with a trimmed name, 404 for no such one and 400 for a bad name', async () => {
    const { post, list } = setup()
    const [first] = (await list()).workspaces
    const chat = first?.chats[0]
    if (first === undefined || chat === undefined) throw new Error('the fake has no chat')
    const workspacePath = `/api/workspaces/${encodeURIComponent(first.id)}/rename`
    const chatPath = `/api/chats/${encodeURIComponent(chat.id)}/rename`
    expect((await post(workspacePath, { name: '  theme explorations ' })).status).toBe(204)
    expect((await post(chatPath, { name: 'Drift check' })).status).toBe(204)
    const after = (await list()).workspaces
    expect(after.find((w) => w.id === first.id)?.label).toBe('theme explorations')
    expect(after.flatMap((w) => w.chats).find((c) => c.id === chat.id)?.title).toBe('Drift check')
    expect((await post('/api/workspaces/test-mac%2Fno-such/rename', { name: 'x' })).status).toBe(404)
    expect((await post('/api/chats/test-mac%2Fno-such/rename', { name: 'x' })).status).toBe(404)
    expect((await post(workspacePath, { name: '   ' })).status).toBe(400)
    expect((await post(chatPath, { name: 'a'.repeat(65) })).status).toBe(400)
  })

  it('orders the workspaces with 204, and 409 orderStale for an order that misses one', async () => {
    const { post, list } = setup()
    const ids = (await list()).workspaces.map((w) => w.id)
    expect((await post('/api/workspaces/order', { workspaces: [...ids].reverse() })).status).toBe(204)
    expect((await list()).workspaces.map((w) => w.id)).toEqual([...ids].reverse())
    const stale = await post('/api/workspaces/order', { workspaces: ids.slice(1) })
    expect(stale.status).toBe(409)
    expect(ErrorBody.parse(await stale.json()).error).toMatchObject({
      kind: 'workspace-not-ready',
      state: 'orderStale',
    })
    expect((await post('/api/workspaces/order', { workspaces: [ids[0], ids[0]] })).status).toBe(400)
    // A list of 300 workspaces is over 4 KiB, and still reaches the order check.
    const many = Array.from({ length: 300 }, (_, i) => `test-mac/w${String(i)}`)
    const large = await post('/api/workspaces/order', { workspaces: many })
    expect(ErrorBody.parse(await large.json()).error).toMatchObject({ state: 'orderStale' })
  })

  it('closes a workspace after its confirm, and refuses one that works, changed or runs the server', async () => {
    const { agents, post, list } = setup()
    const close = (id: string, body: unknown) => post(`/api/workspaces/${encodeURIComponent(id)}/close`, body)
    const state = async (res: Response) => ErrorBody.parse(await res.json()).error
    const [brain, omni] = (await list()).workspaces
    if (brain === undefined || omni === undefined) throw new Error('the fake has no workspaces')
    expect((await close(brain.id, { confirm: omni.id, panes: 2 })).status).toBe(400)
    expect(await state(await close(brain.id, { confirm: brain.id, panes: 2 }))).toMatchObject({ state: 'needsYou' })
    expect(await state(await close(brain.id, { confirm: brain.id, panes: 3 }))).toMatchObject({ state: 'panesChanged' })
    agents.holdServer(omni.id)
    expect(await state(await close(omni.id, { confirm: omni.id, panes: 1 }))).toMatchObject({ state: 'holdsServer' })
    for (const chat of brain.chats) agents.setStatus(chat.id, 'idle')
    expect((await close(brain.id, { confirm: brain.id, panes: 2 })).status).toBe(204)
    expect((await list()).workspaces.map((w) => w.id)).toEqual([omni.id])
    expect((await close(brain.id, { confirm: brain.id, panes: 2 })).status).toBe(404)
  })
})
