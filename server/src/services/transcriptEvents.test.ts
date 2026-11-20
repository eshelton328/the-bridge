import { ChatId, MachineId, TranscriptChangedEvent } from '@bridge/contract'
import { describe, expect, it } from 'vitest'
import { createFakeAgents } from '../adapters/fakeAgents.ts'
import { connectTranscript } from './transcriptEvents.ts'

const machine = MachineId.parse('test-mac')
const themes = ChatId.parse('test-mac/bridge-themes')
const tick = () => new Promise((r) => setTimeout(r, 10))

const client = () => {
  const events: TranscriptChangedEvent[] = []
  const ends: string[] = []
  return {
    events,
    ends,
    send: (e: TranscriptChangedEvent) => events.push(e),
    end: (e: { reason: string }) => ends.push(e.reason),
  }
}

describe('transcript events', () => {
  it('sends only the new or changed entries after it opens, numbered from 0, and nothing for no change', async () => {
    const agents = createFakeAgents(machine)
    const c = client()
    const connected = await connectTranscript(agents, themes, c)
    if (!connected.ok || connected.value === null) throw new Error('not connected')
    expect(c.events).toEqual([])
    agents.changeTranscript(themes, { type: 'assistant', id: 'a2', text: 'Done.', cut: false })
    await tick()
    agents.changeTranscript(themes, { type: 'tool', id: 't2', name: 'Bash', target: 'pnpm', running: false })
    await tick()
    agents.changeTranscript(themes, { type: 'tool', id: 't2', name: 'Bash', target: 'pnpm', running: false })
    await tick()
    expect(c.events).toEqual([
      {
        source: 'test-mac/transcript',
        seq: 0,
        type: 'transcript.changed',
        data: { chat: themes, entries: [{ type: 'assistant', id: 'a2', text: 'Done.', cut: false }] },
      },
      {
        source: 'test-mac/transcript',
        seq: 1,
        type: 'transcript.changed',
        data: { chat: themes, entries: [{ type: 'tool', id: 't2', name: 'Bash', target: 'pnpm', running: false }] },
      },
    ])
    for (const event of c.events) expect(TranscriptChangedEvent.parse(event)).toEqual(event)
    connected.value()
    expect(agents.watchers()).toBe(0)
  })

  it('watches only while a client is connected, and only the chat it asked for', async () => {
    const agents = createFakeAgents(machine)
    expect(agents.watchers()).toBe(0)
    const c = client()
    const connected = await connectTranscript(agents, themes, c)
    if (!connected.ok || connected.value === null) throw new Error('not connected')
    expect(agents.watchers()).toBe(1)
    expect(agents.transcriptReads()).toEqual([themes])
    agents.changeTranscript(ChatId.parse('test-mac/drift-check'), { type: 'user', id: 'u9', text: 'x', cut: false })
    await tick()
    expect(c.events).toEqual([])
    connected.value()
    agents.changeTranscript(themes, { type: 'user', id: 'u10', text: 'after', cut: false })
    await tick()
    expect(c.events).toEqual([])
  })

  it('gives null and watches nothing for a chat that the machine does not have', async () => {
    const agents = createFakeAgents(machine)
    expect(await connectTranscript(agents, ChatId.parse('test-mac/no-such-chat'), client())).toEqual({
      ok: true,
      value: null,
    })
    expect(agents.watchers()).toBe(0)
  })

  it('gives the error when the agents do not answer', async () => {
    const error = { reason: 'unreachable', message: 'no socket' } as const
    const agents = createFakeAgents(machine, { error })
    expect(await connectTranscript(agents, themes, client())).toEqual({ ok: false, error })
  })
})
