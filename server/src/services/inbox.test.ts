import { ChatId, type ChatSummary, InboxId, MachineId, ProjectSlug, WorkspaceId } from '@bridge/contract'
import { err, ok } from '@bridge/shared'
import { describe, expect, it } from 'vitest'
import { createFakeAgents } from '../adapters/fakeAgents.ts'
import { type BrainRequest, createInbox, type InboxMarks } from './inbox.ts'

const machine = MachineId.parse('test-mac')
const question = ChatId.parse('test-mac/drift-check')
const themes = ChatId.parse('test-mac/bridge-themes')
/** The same turn end for each chat asked for, as the turns port gives it. */
const endsFor = (chats: readonly ChatSummary[], end: string | null) => new Map(chats.map((c) => [c.id, end]))

/** The brain's project folders, as the projects port lists them. */
const brainProjects = (...slugs: string[]) => ({
  list: () =>
    Promise.resolve(
      ok(
        slugs.map((slug) => ({ slug: ProjectSlug.parse(slug), name: slug, purpose: '', icon: null, repositories: [] })),
      ),
    ),
})

const request: BrainRequest = {
  id: InboxId.parse('fedcba9876543210'),
  kind: 'review',
  title: 'Example request',
  project: 'example-project',
  tags: ['global/review'],
  created: '2026-11-20T09:00:00.000Z',
  snoozedUntil: null,
  origin: null,
}

function setup(
  options: {
    requests?: BrainRequest[]
    turnEnd?: string | null
    fault?: 'marks' | 'brain' | 'turns'
    projects?: string[]
  } = {},
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
      endsOf: (chats) =>
        Promise.resolve(
          options.fault === 'turns' ? err({ reason: 'unreachable', message: 'down' }) : ok(endsFor(chats, turnEnd)),
        ),
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
    ...(options.projects === undefined ? {} : { projects: brainProjects(...options.projects) }),
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

  it("names a brain item's origin chat: live when listed, not when not, this machine's for a session alone, none for another machine", async () => {
    const at = (machine: string, session: string) => ({
      ...request,
      origin: { machine: MachineId.parse(machine), session },
    })
    const requests = [
      { ...at('test-mac', 'drift-check'), id: InboxId.parse('0000000000000001') },
      { ...at('test-mac', 'gone-chat'), id: InboxId.parse('0000000000000002') },
      { ...at('other-mac', 'drift-check'), id: InboxId.parse('0000000000000003') },
      { ...request, id: InboxId.parse('0000000000000004') },
      { ...request, origin: { machine: null, session: 'drift-check' }, id: InboxId.parse('0000000000000005') },
    ]
    const listed = await setup({ requests }).list()
    const origins = Object.fromEntries(listed.items.map((i) => [i.id, i.origin]))
    expect(origins).toEqual({
      [listed.items.find((i) => i.source === 'chat')?.id ?? 'none']: null,
      '0000000000000001': { chat: question, live: true },
      '0000000000000002': { chat: ChatId.parse('test-mac/gone-chat'), live: false },
      '0000000000000003': null,
      '0000000000000004': null,
      '0000000000000005': { chat: question, live: true },
    })
  })

  it("gives a brain item its project's live workspace, and a chat item or another project none (R49)", async () => {
    const other = { ...request, id: InboxId.parse('0000000000000006'), project: 'other-project' }
    const { agents, list } = setup({ requests: [request, other] })
    const spaces = await agents.listWorkspaces()
    const space = spaces.ok ? spaces.value[0]?.id : undefined
    if (space === undefined) throw new Error('the fake lists no workspace')
    agents.setProjectWorkspace('example-project', space)
    agents.setProjectWorkspace('other-project', WorkspaceId.parse('test-mac/w-closed'))
    const listed = await list()
    expect(listed.items.map((i) => [i.source, i.project, i.workspace])).toEqual([
      ['chat', null, null],
      ['brain', 'example-project', space],
      ['brain', 'other-project', null],
    ])
  })

  it("names a chat item's project from its pane's project tag, only for a project of the brain (d-120)", async () => {
    const { agents, list } = setup({ projects: ['example-project', 'ncc-1701'] })
    agents.setStatus(themes, 'done')
    agents.setChatTags(question, { project: 'ncc-1701', area: 'bridge' })
    // An untagged chat (themes) names none; a brain item keeps its record's project.
    const projects = async () => (await list()).items.map((i) => [i.chat ?? i.source, i.project])
    expect(await projects()).toEqual(
      expect.arrayContaining([
        [question, 'ncc-1701'],
        [themes, null],
        ['brain', 'example-project'],
      ]),
    )
    // A tag that names no project of the brain, or one not written as a slug is, gives none.
    agents.setChatTags(question, { project: 'not-a-project' })
    agents.setChatTags(themes, { project: 'NCC-1701' })
    expect(await projects()).toEqual(
      expect.arrayContaining([
        [question, null],
        [themes, null],
        ['brain', 'example-project'],
      ]),
    )
    expect(await projects()).toHaveLength(3)
  })

  it('names no chat project where the inbox has no projects port, and reads no tags then', async () => {
    const { agents, list } = setup()
    let reads = 0
    const tags = agents.chatTags.bind(agents)
    agents.setChatTags(question, { project: 'example-project' })
    Object.assign(agents, { chatTags: () => ((reads += 1), tags()) })
    expect((await list()).items.map((i) => [i.source, i.project])).toEqual([
      ['chat', null],
      ['brain', 'example-project'],
    ])
    expect(reads).toBe(0)
  })

  it('reads the tags with one pane list and the projects once for a build (NCC-138)', async () => {
    const agents = createFakeAgents(machine)
    agents.setChatTags(question, { project: 'example-project' })
    const reads = { tags: 0, projects: 0, lists: 0 }
    const inbox = createInbox({
      agents: {
        ...agents,
        listWorkspaces: () => ((reads.lists += 1), agents.listWorkspaces()),
        chatTags: () => ((reads.tags += 1), agents.chatTags()),
      },
      brain: { list: () => Promise.resolve(ok([])), body: () => Promise.resolve(ok(null)) },
      turns: { endsOf: (chats) => Promise.resolve(ok(endsFor(chats, '2026-11-21T10:00:00.000Z'))) },
      marks: { load: () => Promise.resolve(ok({})), save: () => Promise.resolve(ok(undefined)) },
      projects: { list: () => ((reads.projects += 1), brainProjects('example-project').list()) },
    })
    const [one, two] = await Promise.all([inbox.list(), inbox.list()])
    expect(one.ok && one.value.items.map((i) => i.project)).toEqual(['example-project'])
    expect(two).toEqual(one)
    expect(reads).toEqual({ tags: 1, projects: 1, lists: 1 })
  })

  it('starts the tags and projects reads with the workspace list, not after it (NCC-138)', async () => {
    const agents = createFakeAgents(machine)
    agents.setChatTags(question, { project: 'example-project' })
    const started: string[] = []
    let release: () => void = () => undefined
    const held = new Promise<void>((resolve) => {
      release = resolve
    })
    const inbox = createInbox({
      agents: {
        ...agents,
        listWorkspaces: async () => (started.push('list'), await held, agents.listWorkspaces()),
        chatTags: () => (started.push('tags'), agents.chatTags()),
      },
      brain: { list: () => Promise.resolve(ok([])), body: () => Promise.resolve(ok(null)) },
      turns: { endsOf: (chats) => Promise.resolve(ok(endsFor(chats, '2026-11-21T10:00:00.000Z'))) },
      marks: { load: () => Promise.resolve(ok({})), save: () => Promise.resolve(ok(undefined)) },
      projects: { list: () => (started.push('projects'), brainProjects('example-project').list()) },
    })
    const read = inbox.list()
    await new Promise((resolve) => setImmediate(resolve))
    // While the workspace list waits, the tags and the projects are already read.
    expect([...started].sort()).toEqual(['list', 'projects', 'tags'])
    release()
    const listed = await read
    expect(listed.ok && listed.value.items.map((i) => i.project)).toEqual(['example-project'])
  })

  it('fails the read when the tags or the projects fail, by their fault', async () => {
    const agents = createFakeAgents(machine)
    const deps = {
      brain: { list: () => Promise.resolve(ok([])), body: () => Promise.resolve(ok(null)) },
      marks: { load: () => Promise.resolve(ok({})), save: () => Promise.resolve(ok(undefined)) },
    }
    const down = { reason: 'unreachable' as const, message: 'down' }
    const noTags = createInbox({
      ...deps,
      agents: { ...agents, chatTags: () => Promise.resolve(err(down)) },
      projects: brainProjects('example-project'),
    })
    expect(await noTags.list()).toEqual(err(down))
    const noProjects = createInbox({
      ...deps,
      agents,
      projects: { list: () => Promise.resolve(err({ reason: 'failed' as const, code: 'EACCES' })) },
    })
    expect(await noProjects.list()).toEqual(err({ reason: 'failed', code: 'EACCES' }))
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
      turns: { endsOf: (chats) => Promise.resolve(ok(endsFor(chats, turn.end))) },
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
        endsOf: (chats) =>
          Promise.resolve(
            turns.fail
              ? err({ reason: 'unreachable', message: 'down' })
              : ok(endsFor(chats, '2026-11-21T10:00:00.000Z')),
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

  it('reads the turn ends once for all the waiting chats, never once for each (NCC-138)', async () => {
    const agents = createFakeAgents(machine)
    agents.setStatus(themes, 'done')
    const asked: ChatId[][] = []
    const inbox = createInbox({
      agents,
      brain: { list: () => Promise.resolve(ok([])), body: () => Promise.resolve(ok(null)) },
      turns: {
        endsOf: (chats) => {
          asked.push(chats.map((c) => c.id))
          return Promise.resolve(ok(endsFor(chats, '2026-11-21T10:00:00.000Z')))
        },
      },
      marks: { load: () => Promise.resolve(ok({})), save: () => Promise.resolve(ok(undefined)) },
    })
    const listed = await inbox.list()
    expect(listed.ok && listed.value.items.map((i) => i.chat)).toEqual(expect.arrayContaining([question, themes]))
    expect(asked).toHaveLength(1)
    expect(asked[0]).toEqual(expect.arrayContaining([question, themes]))
  })

  it('shares one build among lists that cross (NCC-138)', async () => {
    let builds = 0
    let release: () => void = () => undefined
    const held = new Promise<void>((resolve) => (release = resolve))
    const inbox = createInbox({
      agents: createFakeAgents(machine),
      brain: {
        list: async () => {
          builds += 1
          await held
          return ok([request])
        },
        body: () => Promise.resolve(ok(null)),
      },
      turns: { endsOf: (chats) => Promise.resolve(ok(endsFor(chats, '2026-11-21T10:00:00.000Z'))) },
      marks: { load: () => Promise.resolve(ok({})), save: () => Promise.resolve(ok(undefined)) },
    })
    const lists = [inbox.list(), inbox.list(), inbox.list()]
    release()
    const answers = await Promise.all(lists)
    expect(builds).toBe(1)
    expect(answers[1]).toEqual(answers[0])
    expect(answers[2]).toEqual(answers[0])
    await inbox.list()
    expect(builds).toBe(2)
  })

  it('gives a list that starts while a build reads a new build, so a change in between shows (NCC-138 review)', async () => {
    let builds = 0
    let release: () => void = () => undefined
    let requests: BrainRequest[] = []
    const inbox = createInbox({
      agents: createFakeAgents(machine),
      brain: {
        list: async () => {
          builds += 1
          const now = requests
          if (builds === 1) await new Promise<void>((resolve) => (release = resolve))
          return ok(now)
        },
        body: () => Promise.resolve(ok(null)),
      },
      turns: { endsOf: (chats) => Promise.resolve(ok(endsFor(chats, '2026-11-21T10:00:00.000Z'))) },
      marks: { load: () => Promise.resolve(ok({})), save: () => Promise.resolve(ok(undefined)) },
    })
    const before = inbox.list()
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(builds).toBe(1)
    requests = [request]
    const after = inbox.list()
    const alsoAfter = inbox.list()
    release()
    const old = await before
    expect(old.ok && old.value.items.map((i) => i.id)).not.toContain(request.id)
    const fresh = await after
    expect(fresh.ok && fresh.value.items.map((i) => i.id)).toContain(request.id)
    expect(await alsoAfter).toEqual(fresh)
    expect(builds).toBe(2)
  })

  it('gives a list that starts after an act a new build, never the one in flight (NCC-138)', async () => {
    let hold = false
    let release: () => void = () => undefined
    let stored: InboxMarks = {}
    const inbox = createInbox({
      agents: createFakeAgents(machine),
      brain: {
        list: async () => {
          if (hold) await new Promise<void>((resolve) => (release = resolve))
          return ok([])
        },
        body: () => Promise.resolve(ok(null)),
      },
      turns: { endsOf: (chats) => Promise.resolve(ok(endsFor(chats, '2026-11-21T10:00:00.000Z'))) },
      marks: { load: () => Promise.resolve(ok(stored)), save: (m) => ((stored = m), Promise.resolve(ok(undefined))) },
    })
    const first = await inbox.list()
    const id = first.ok ? first.value.items.find((i) => i.chat === question)?.id : undefined
    if (id === undefined) throw new Error('no item')
    hold = true
    const before = inbox.list()
    const acted = inbox.act(id, { action: 'dismiss' })
    const after = inbox.list()
    hold = false
    release()
    expect(await acted).toEqual(ok('done'))
    const old = await before
    expect(old.ok && old.value.items.map((i) => i.id)).toContain(id)
    const fresh = await after
    expect(fresh.ok && fresh.value.items.map((i) => i.id)).not.toContain(id)
  })

  it('gives a fault of the brain or the store by its code', async () => {
    expect(await setup({ fault: 'brain' }).inbox.list()).toEqual(err({ reason: 'failed', code: 'EACCES' }))
    const { inbox, list } = setup({ fault: 'marks', requests: [] })
    const id = (await list()).items[0]?.id
    if (id === undefined) throw new Error('no item')
    expect(await inbox.act(id, { action: 'done' })).toEqual(err({ reason: 'failed', code: 'ENOSPC' }))
  })
})
