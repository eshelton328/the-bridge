import { ChatId, LiveEvent, MachineId, WorkspaceId } from '@bridge/contract'
import { describe, expect, it } from 'vitest'
import { createFakeAgents } from '../adapters/fakeAgents.ts'
import { createLiveEvents } from './liveEvents.ts'

const machine = MachineId.parse('test-mac')
const drift = ChatId.parse('test-mac/drift-check')

const client = () => {
  const events: LiveEvent[] = []
  const ends: string[] = []
  return { events, ends, send: (e: LiveEvent) => events.push(e), end: (e: { message: string }) => ends.push(e.message) }
}

describe('live events', () => {
  it('opens no subscription until a client connects, and one for two clients', () => {
    const agents = createFakeAgents(machine)
    const live = createLiveEvents(agents)
    expect(agents.subscriptions()).toBe(0)
    const leaveA = live.connect(client())
    const leaveB = live.connect(client())
    expect(agents.subscriptions()).toBe(1)
    leaveA()
    expect(agents.subscriptions()).toBe(1)
    leaveB()
    expect(agents.subscriptions()).toBe(0)
    expect(agents.reads()).toBe(0)
  })

  it('sends each client the events in order, numbered from 0, from "<machine>/agents"', () => {
    const agents = createFakeAgents(machine)
    const live = createLiveEvents(agents)
    const [a, b] = [client(), client()]
    live.connect(a)
    live.connect(b)
    agents.setStatus(drift, 'working')
    agents.changeList()
    agents.changeLayout(WorkspaceId.parse('test-mac/omni-brain'))
    const expected = [
      { source: 'test-mac/agents', seq: 0, type: 'chat.status', data: { chat: drift, status: 'working' } },
      // A status change adds or removes the chat's Inbox item.
      { source: 'test-mac/agents', seq: 1, type: 'inbox.changed', data: {} },
      { source: 'test-mac/agents', seq: 2, type: 'workspaces.changed', data: {} },
      // A list change can remove a chat's item too (a closed or cleared chat).
      { source: 'test-mac/agents', seq: 3, type: 'inbox.changed', data: {} },
      { source: 'test-mac/agents', seq: 4, type: 'layout.changed', data: { workspace: 'test-mac/omni-brain' } },
    ]
    expect(a.events).toEqual(expected)
    expect(b.events).toEqual(expected)
    for (const event of a.events) expect(LiveEvent.parse(event)).toEqual(event)
  })

  it('ends every client when the agents stop answering, and subscribes again for the next client', () => {
    const agents = createFakeAgents(machine)
    const live = createLiveEvents(agents)
    const a = client()
    live.connect(a)
    agents.endAll({ reason: 'unreachable', message: 'herdr closed the events.subscribe stream' })
    expect(a.ends).toEqual(['herdr closed the events.subscribe stream'])
    expect(live.clients()).toBe(0)
    const b = client()
    live.connect(b)
    expect(agents.subscriptions()).toBe(1)
    agents.setStatus(drift, 'idle')
    expect(b.events.map((e) => e.type)).toEqual(['chat.status', 'inbox.changed', 'workspaces.changed', 'inbox.changed'])
    expect(a.events).toEqual([])
  })
})

describe('the Inbox events', () => {
  const watcher = () => {
    const state: { open: number; tell: (() => void) | undefined } = { open: 0, tell: undefined }
    const watch = (onChange: () => void) => {
      state.open += 1
      state.tell = onChange
      return () => {
        state.open -= 1
      }
    }
    return { state, watch }
  }

  it('watches the brain only while a client is open, and sends inbox.changed on each change', () => {
    const { state, watch } = watcher()
    const live = createLiveEvents(createFakeAgents(machine), watch)
    expect(state.open).toBe(0)
    const a = client()
    const leaveA = live.connect(a)
    const leaveB = live.connect(client())
    expect(state.open).toBe(1)
    state.tell?.()
    live.inboxChanged()
    expect(a.events.map((e) => [e.type, e.seq])).toEqual([
      ['inbox.changed', 0],
      ['inbox.changed', 1],
    ])
    leaveA()
    expect(state.open).toBe(1)
    leaveB()
    expect(state.open).toBe(0)
  })

  it('closes the watch when the agents stop answering, and sends nothing with no client', () => {
    const { state, watch } = watcher()
    const agents = createFakeAgents(machine)
    const live = createLiveEvents(agents, watch)
    live.inboxChanged()
    const a = client()
    live.connect(a)
    agents.endAll({ reason: 'unreachable', message: 'down' })
    expect(state.open).toBe(0)
    expect(a.events).toEqual([])
  })
})

describe('the projects events', () => {
  it('watches the PR answers only while a client is open, and sends projects.changed on each change', () => {
    const state: { open: number; tell: (() => void) | undefined } = { open: 0, tell: undefined }
    const watch = (onChange: () => void) => {
      state.open += 1
      state.tell = onChange
      return () => {
        state.open -= 1
      }
    }
    const agents = createFakeAgents(machine)
    const live = createLiveEvents(agents, undefined, watch)
    expect(state.open).toBe(0)
    const a = client()
    live.connect(a)
    expect(state.open).toBe(1)
    state.tell?.()
    expect(a.events.map((e) => e.type)).toEqual(['projects.changed'])
    agents.endAll({ reason: 'unreachable', message: 'down' })
    expect(state.open).toBe(0)
  })

  it('watches the diagram runs only while a client is open, and sends architecture.changed with the slug and scope', () => {
    const state: { open: number; tell: ((key: { slug: string; scope: string }) => void) | undefined } = {
      open: 0,
      tell: undefined,
    }
    const watch = (onChange: (key: { slug: string; scope: string }) => void) => {
      state.open += 1
      state.tell = onChange
      return () => {
        state.open -= 1
      }
    }
    const live = createLiveEvents(createFakeAgents(machine), undefined, undefined, watch)
    expect(state.open).toBe(0)
    const a = client()
    const leave = live.connect(a)
    expect(state.open).toBe(1)
    state.tell?.({ slug: 'example-project', scope: '@system' })
    expect(a.events.map((e) => [e.type, e.data])).toEqual([
      ['architecture.changed', { slug: 'example-project', scope: '@system' }],
    ])
    leave()
    expect(state.open).toBe(0)
  })
})
