import { ChatId, InboxId, MachineId } from '@bridge/contract'
import { err, ok } from '@bridge/shared'
import { describe, expect, it } from 'vitest'
import { createFakeAgents } from '../adapters/fakeAgents.ts'
import { type BrainRequest, createInbox, type InboxMarks } from './inbox.ts'

const machine = MachineId.parse('test-mac')
const question = ChatId.parse('test-mac/drift-check')
const themes = ChatId.parse('test-mac/bridge-themes')
const request: BrainRequest = {
  id: InboxId.parse('fedcba9876543210'),
  kind: 'review',
  title: 'Example request',
  project: 'example-project',
  tags: ['global/review'],
  created: '2026-11-20T09:00:00.000Z',
  snoozedUntil: null,
}

function setup(
  options: { requests?: BrainRequest[]; turnEnd?: string | null; fault?: 'marks' | 'brain' | 'turns' } = {},
) {
  const agents = createFakeAgents(machine)
  let stored: InboxMarks = {}
  const saves: InboxMarks[] = []
  const turnEnd = options.turnEnd === undefined ? '2026-11-21T10:00:00.000Z' : options.turnEnd
  let time = new Date('2026-11-21T12:00:00.000Z')
  const inbox = createInbox({
    agents,
    brain: {
      list: () =>
        Promise.resolve(
          options.fault === 'brain' ? err({ reason: 'failed', code: 'EACCES' }) : ok(options.requests ?? [request]),
        ),
      body: (id) => Promise.resolve(ok(id === request.id ? '# Example\n\nThe body.' : null)),
    },
    turns: {
      endOf: () =>
        Promise.resolve(options.fault === 'turns' ? err({ reason: 'unreachable', message: 'down' }) : ok(turnEnd)),
    },
    marks: {
      load: () => Promise.resolve(ok(stored)),
      save: (marks) => {
        if (options.fault === 'marks') return Promise.resolve(err({ reason: 'failed', code: 'ENOSPC' }))
        stored = marks
        saves.push(marks)
        return Promise.resolve(ok(undefined))
      },
    },
    now: () => time,
  })
  const list = async () => {
    const listed = await inbox.list()
    if (!listed.ok) throw new Error('the list failed')
    return listed.value
  }
  return { agents, inbox, list, saves, setTime: (t: string) => (time = new Date(t)) }
}

describe('the inbox', () => {
  it('lists a chat that needs the owner and an open request, and counts both on the badge', async () => {
    const { list } = setup()
    const listed = await list()
    expect(listed.items.map((i) => [i.source, i.kind, i.chat, i.needsYou])).toEqual([
      ['chat', 'question', question, true],
      ['brain', 'review', null, true],
    ])
    expect(listed.counts).toEqual({ needsYou: 2, total: 2 })
    expect(listed.items[1]?.actions).toEqual([])
  })

  it('lists a done chat as a review that is not on the badge, and drops it when the chat works again', async () => {
    const { agents, list } = setup({ requests: [] })
    agents.setStatus(themes, 'done')
    const listed = await list()
    expect(listed.items.find((i) => i.chat === themes)).toMatchObject({ kind: 'review', needsYou: false })
    expect(listed.counts).toEqual({ needsYou: 1, total: 2 })
    agents.setStatus(themes, 'working')
    expect((await list()).items.some((i) => i.chat === themes)).toBe(false)
  })

  it('hides a done mark for that turn only, so the next turn shows again', async () => {
    const turn = { end: '2026-11-21T10:00:00.000Z' }
    const agents = createFakeAgents(machine)
    let stored: InboxMarks = {}
    const inbox = createInbox({
      agents,
      brain: { list: () => Promise.resolve(ok([])), body: () => Promise.resolve(ok(null)) },
      turns: { endOf: () => Promise.resolve(ok(turn.end)) },
      marks: { load: () => Promise.resolve(ok(stored)), save: (m) => ((stored = m), Promise.resolve(ok(undefined))) },
    })
    const first = await inbox.list()
    const id = first.ok ? first.value.items[0]?.id : undefined
    if (id === undefined) throw new Error('no item')
    expect(await inbox.act(id, { action: 'done' })).toEqual(ok('done'))
    const after = await inbox.list()
    expect(after.ok && after.value.items).toEqual([])
    turn.end = '2026-11-21T11:00:00.000Z'
    const next = await inbox.list()
    expect(next.ok && next.value.items.map((i) => i.chat)).toEqual([question])
    expect(next.ok && next.value.items[0]?.id).not.toBe(id)
    // The mark of the ended turn is dropped, so the store holds only marks of items there now.
    expect(stored).toEqual({})
  })

  it('takes a snooze off the badge until its time, then shows the item again', async () => {
    const { inbox, list, setTime } = setup({ requests: [] })
    const id = (await list()).items[0]?.id
    if (id === undefined) throw new Error('no item')
    await inbox.act(id, { action: 'snooze', until: '2026-11-21T13:00:00.000Z' })
    expect((await list()).items[0]).toMatchObject({ snoozedUntil: '2026-11-21T13:00:00.000Z', needsYou: false })
    expect((await list()).counts.needsYou).toBe(0)
    setTime('2026-11-21T13:00:01.000Z')
    expect((await list()).items[0]).toMatchObject({ snoozedUntil: null, needsYou: true })
  })

  it('takes no action on a turn with no known end, so no mark can hide its next turn', async () => {
    const { agents, inbox, list, setTime, saves } = setup({ requests: [], turnEnd: null })
    const item = (await list()).items[0]
    if (item === undefined) throw new Error('no item')
    expect(item).toMatchObject({ actions: [], createdAt: '2026-11-21T12:00:00.000Z', needsYou: true })
    expect(await inbox.act(item.id, { action: 'dismiss' })).toEqual(ok('readOnly'))
    expect(saves).toEqual([])
    // The chat works and asks again with no read between: the question still shows.
    agents.setStatus(question, 'working')
    agents.setStatus(question, 'needsYou')
    setTime('2026-11-21T12:30:00.000Z')
    expect((await list()).items).toMatchObject([
      { chat: question, needsYou: true, createdAt: '2026-11-21T12:00:00.000Z' },
    ])
  })

  it('refuses an action on a brain item and an unknown ID', async () => {
    const { inbox, saves } = setup()
    expect(await inbox.act(request.id, { action: 'done' })).toEqual(ok('readOnly'))
    expect(await inbox.act(InboxId.parse('0000000000000000'), { action: 'done' })).toEqual(ok('notFound'))
    expect(saves).toEqual([])
  })

  it("gives a brain item's body and a chat item's chat as the detail", async () => {
    const { inbox, list } = setup()
    const brainDetail = await inbox.get(request.id)
    expect(brainDetail.ok && brainDetail.value !== 'notFound' && brainDetail.value.detail).toEqual({
      source: 'brain',
      body: '# Example\n\nThe body.',
    })
    const chatItem = (await list()).items[0]
    if (chatItem === undefined) throw new Error('no item')
    const detail = await inbox.get(chatItem.id)
    expect(detail.ok && detail.value !== 'notFound' && detail.value.detail).toEqual({
      source: 'chat',
      chat: { chat: question, workspace: 'test-mac/omni-brain', title: 'drift check', model: 'gpt-5.5' },
    })
    expect(await inbox.get(InboxId.parse('0000000000000000'))).toEqual(ok('notFound'))
  })

  it('fails the read when a turn end fails, and keeps the saved marks', async () => {
    const turns = { fail: false }
    const agents = createFakeAgents(machine)
    let stored: InboxMarks = {}
    const inbox = createInbox({
      agents,
      brain: { list: () => Promise.resolve(ok([])), body: () => Promise.resolve(ok(null)) },
      turns: {
        endOf: () =>
          Promise.resolve(
            turns.fail ? err({ reason: 'unreachable', message: 'down' }) : ok('2026-11-21T10:00:00.000Z'),
          ),
      },
      marks: { load: () => Promise.resolve(ok(stored)), save: (m) => ((stored = m), Promise.resolve(ok(undefined))) },
    })
    const first = await inbox.list()
    const id = first.ok ? first.value.items[0]?.id : undefined
    if (id === undefined) throw new Error('no item')
    await inbox.act(id, { action: 'dismiss' })
    turns.fail = true
    expect(await inbox.list()).toEqual(err({ reason: 'unreachable', message: 'down' }))
    expect(Object.keys(stored)).toEqual([id])
    turns.fail = false
    const after = await inbox.list()
    expect(after.ok && after.value.items).toEqual([])
  })

  it('gives a fault of the brain or the store by its code', async () => {
    expect(await setup({ fault: 'brain' }).inbox.list()).toEqual(err({ reason: 'failed', code: 'EACCES' }))
    const { inbox, list } = setup({ fault: 'marks', requests: [] })
    const id = (await list()).items[0]?.id
    if (id === undefined) throw new Error('no item')
    expect(await inbox.act(id, { action: 'done' })).toEqual(err({ reason: 'failed', code: 'ENOSPC' }))
  })
})
