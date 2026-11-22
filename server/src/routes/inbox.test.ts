// API tests of /api/inbox (R20), in process with the fake agents, a made-up
// brain request and marks in memory.
import { ChatId, ErrorBody, InboxDetailResponse, InboxId, InboxResponse, MachineId } from '@bridge/contract'
import { err, ok } from '@bridge/shared'
import { describe, expect, it } from 'vitest'
import { createFakeAgents } from '../adapters/fakeAgents.ts'
import { createApp } from '../app.ts'
import { memoryLogger } from '../logger.ts'
import { createInbox, type InboxMarks } from '../services/inbox.ts'

const local = { Host: '127.0.0.1:5181' }
const json = { ...local, 'Content-Type': 'application/json' }
const brainId = InboxId.parse('fedcba9876543210')
const themes = ChatId.parse('test-mac/bridge-themes')

function setup(options: { failing?: boolean } = {}) {
  const agents = createFakeAgents(MachineId.parse('test-mac'))
  agents.setStatus(themes, 'done')
  // Newer than the time the server first sees the Codex question, so the list order is fixed.
  agents.setTurnEnd(themes, '2098-01-01T00:00:00.000Z')
  let stored: InboxMarks = {}
  const logger = memoryLogger()
  const fault = err({ reason: 'failed' as const, code: 'EACCES' })
  const inbox = createInbox({
    agents,
    brain: {
      list: () =>
        Promise.resolve(
          options.failing
            ? fault
            : ok([
                {
                  id: brainId,
                  kind: 'review' as const,
                  title: 'Example marker-5150 request',
                  project: 'example-project',
                  tags: ['global/review'],
                  created: '2026-11-20T09:00:00.000Z',
                  snoozedUntil: null,
                },
              ]),
        ),
      body: () => Promise.resolve(ok('# Example\n\nThe body.')),
    },
    marks: { load: () => Promise.resolve(ok(stored)), save: (m) => ((stored = m), Promise.resolve(ok(undefined))) },
  })
  const app = createApp({ agents, owner: 'owner@example.com', log: logger.log, inbox })
  const list = async () => InboxResponse.parse(await (await app.request('/api/inbox', { headers: local })).json())
  return { app, list, logger }
}

describe('/api/inbox', () => {
  it('lists a done Claude chat with its actions, the Codex question without them, and the brain request', async () => {
    const { list } = setup()
    const listed = await list()
    expect(listed.items.map((i) => [i.source, i.kind, i.actions.length])).toEqual([
      ['chat', 'review', 3],
      ['chat', 'question', 0],
      ['brain', 'review', 0],
    ])
    expect(listed.counts).toEqual({ needsYou: 2, total: 3 })
  })

  it('gives the detail of a brain item and of a chat item', async () => {
    const { app, list } = setup()
    const brain = await app.request(`/api/inbox/${brainId}`, { headers: local })
    expect(InboxDetailResponse.parse(await brain.json()).detail).toEqual({
      source: 'brain',
      body: '# Example\n\nThe body.',
    })
    const chatId = (await list()).items[0]?.id ?? ''
    const chat = InboxDetailResponse.parse(await (await app.request(`/api/inbox/${chatId}`, { headers: local })).json())
    expect(chat.detail).toMatchObject({ source: 'chat', chat: { chat: themes } })
  })

  it('marks a chat item done (204), and it leaves the list', async () => {
    const { app, list } = setup()
    const id = (await list()).items[0]?.id ?? ''
    const res = await app.request(`/api/inbox/${id}/done`, { method: 'POST', headers: json, body: '{}' })
    expect(res.status).toBe(204)
    expect((await list()).items.some((i) => i.id === id)).toBe(false)
  })

  it('snoozes a chat item until a time', async () => {
    const { app, list } = setup()
    const id = (await list()).items[0]?.id ?? ''
    const until = '2099-01-01T00:00:00.000Z'
    const res = await app.request(`/api/inbox/${id}/snooze`, {
      method: 'POST',
      headers: json,
      body: JSON.stringify({ until }),
    })
    expect(res.status).toBe(204)
    expect((await list()).items.find((i) => i.id === id)?.snoozedUntil).toBe(until)
  })

  it('answers 409 inbox-read-only for a brain item and a chat item with no actions', async () => {
    const { app, list } = setup()
    const codex = (await list()).items[1]?.id ?? ''
    for (const id of [brainId, codex]) {
      const res = await app.request(`/api/inbox/${id}/dismiss`, { method: 'POST', headers: json, body: '{}' })
      expect(res.status).toBe(409)
      expect(ErrorBody.parse(await res.json()).error.kind).toBe('inbox-read-only')
    }
  })

  it('answers 400 for an ID that is not 16 hex characters, 404 for an unknown one, and 400 for a bad body', async () => {
    const { app } = setup()
    expect((await app.request('/api/inbox/..%2Fsecret', { headers: local })).status).toBe(400)
    expect((await app.request('/api/inbox/0000000000000000', { headers: local })).status).toBe(404)
    const bad = await app.request(`/api/inbox/${brainId}/snooze`, {
      method: 'POST',
      headers: json,
      body: '{"until":"soon"}',
    })
    expect(bad.status).toBe(400)
  })

  it('answers 500 for a brain fault and logs its code only', async () => {
    const { app, logger } = setup({ failing: true })
    const res = await app.request('/api/inbox', { headers: local })
    expect(res.status).toBe(500)
    expect(logger.lines().find((l) => l.msg === 'inbox read failed')).toMatchObject({ code: 'EACCES' })
    expect(logger.text()).not.toContain('marker-5150')
  })
})
