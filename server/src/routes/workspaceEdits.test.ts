// API tests of the edit routes (R41, R42): rename a workspace and a chat, and
// the owner's order of the workspaces, with the fake adapter (d-113).
import { ErrorBody, MachineId, WorkspacesResponse } from '@bridge/contract'
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
  return { post, list }
}

describe('the edit routes', () => {
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
  })
})
