// API tests of GET /api/chats/:chat/transcript/events (d-113): the app in
// process with the fake adapter, the SSE body read as it streams.
import { ChatId, ErrorBody, MachineId, TranscriptChangedEvent } from '@bridge/contract'
import { describe, expect, it } from 'vitest'
import { createFakeAgents } from '../adapters/fakeAgents.ts'
import { createApp } from '../app.ts'
import { memoryLogger } from '../logger.ts'

const machine = MachineId.parse('test-mac')
const owner = 'owner@example.com'
const local = { Host: '127.0.0.1:5181' }
const themes = 'test-mac/bridge-themes'
const eventsPath = (id: string) => `/api/chats/${encodeURIComponent(id)}/transcript/events`

type Frame = { event?: string; id?: string; data?: string; retry?: string }

/** Reads SSE frames from `body` until `count` frames came. */
async function frames(body: ReadableStream<Uint8Array>, count: number): Promise<Frame[]> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let text = ''
  const read: Frame[] = []
  while (read.length < count) {
    const { value, done } = await reader.read()
    if (done) break
    text += decoder.decode(value, { stream: true })
    for (let at = text.indexOf('\n\n'); at !== -1; at = text.indexOf('\n\n')) {
      const block = text.slice(0, at)
      text = text.slice(at + 2)
      const frame: Frame = {}
      for (const line of block.split('\n')) {
        const colon = line.indexOf(':')
        const key = line.slice(0, colon)
        const value = line.slice(colon + 1).trimStart()
        if (key === 'event' || key === 'id' || key === 'data' || key === 'retry') frame[key] = value
      }
      if (Object.keys(frame).length > 0) read.push(frame)
    }
  }
  reader.releaseLock()
  return read
}

const tick = () => new Promise((r) => setTimeout(r, 20))

describe('GET /api/chats/:chat/transcript/events', () => {
  it('streams the open frame, then each change with its type and sequence number, and logs no transcript text', async () => {
    const logger = memoryLogger()
    const agents = createFakeAgents(machine)
    const res = await createApp({ agents, owner, log: logger.log }).request(eventsPath(themes), { headers: local })
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/event-stream')
    if (!res.body) throw new Error('no body')
    const body = res.body
    expect(await frames(body, 1)).toEqual([{ event: 'open', data: '{}', retry: '5000' }])
    const text = 'A reply that must stay out of logs.'
    agents.changeTranscript(ChatId.parse(themes), { type: 'assistant', id: 'a9', text, cut: false })
    const [change] = await frames(body, 1)
    expect(change?.event).toBe('transcript.changed')
    expect(change?.id).toBe('0')
    expect(TranscriptChangedEvent.parse(JSON.parse(change?.data ?? '')).data.entries).toEqual([
      { type: 'assistant', id: 'a9', text, cut: false },
    ])
    await body.cancel()
    await tick()
    expect(agents.watchers()).toBe(0)
    expect(JSON.stringify(logger.lines())).not.toContain(text)
  })

  it('answers 404 for a chat that the machine does not have and 400 for an ID with no machine, and watches nothing', async () => {
    const agents = createFakeAgents(machine)
    const app = createApp({ agents, owner, log: memoryLogger().log })
    const missing = await app.request(eventsPath('test-mac/no-such-chat'), { headers: local })
    expect(missing.status).toBe(404)
    expect(ErrorBody.parse(await missing.json()).error.kind).toBe('not-found')
    const bad = await app.request(eventsPath('bridge-themes'), { headers: local })
    expect(bad.status).toBe(400)
    expect(agents.watchers()).toBe(0)
  })

  it('answers 503 when herdr does not answer, with no socket path in the body', async () => {
    const error = { reason: 'unreachable', message: 'herdr socket /home/dev/.config/herdr/herdr.sock: ENOENT' } as const
    const res = await createApp({
      agents: createFakeAgents(machine, { error }),
      owner,
      log: memoryLogger().log,
    }).request(eventsPath(themes), { headers: local })
    expect(res.status).toBe(503)
    expect(JSON.stringify(ErrorBody.parse(await res.json()))).not.toContain('/home/dev')
  })

  it('refuses another Tailscale login before it watches', async () => {
    const agents = createFakeAgents(machine)
    const res = await createApp({ agents, owner, log: memoryLogger().log }).request(eventsPath(themes), {
      headers: {
        Host: 'mac.tailnet.example',
        'X-Forwarded-For': '203.0.113.2',
        'Tailscale-User-Login': 'someone@example.com',
      },
    })
    expect(res.status).toBe(403)
    expect(agents.watchers()).toBe(0)
  })
})
