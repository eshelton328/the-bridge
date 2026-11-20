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
      { source: 'test-mac/agents', seq: 1, type: 'workspaces.changed', data: {} },
      { source: 'test-mac/agents', seq: 2, type: 'layout.changed', data: { workspace: 'test-mac/omni-brain' } },
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
    expect(b.events.map((e) => e.type)).toEqual(['chat.status', 'workspaces.changed'])
    expect(a.events).toEqual([])
  })
})
