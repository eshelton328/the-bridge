// API tests of GET /api/events (d-113): the app in process with the fake
// adapter, the SSE body read as it streams.
import { ChatId, LiveEvent, MachineId } from '@bridge/contract'
import { describe, expect, it } from 'vitest'
import { createFakeAgents } from '../adapters/fakeAgents.ts'
import { createApp } from '../app.ts'

const machine = MachineId.parse('test-mac')
const owner = 'owner@example.com'
const local = { Host: '127.0.0.1:5181' }
const drift = ChatId.parse('test-mac/drift-check')

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

describe('GET /api/events', () => {
  it('streams the open frame with the retry time, then each event with its type, sequence number and envelope', async () => {
    const agents = createFakeAgents(machine)
    const res = await createApp({ agents, owner }).request('/api/events', { headers: local })
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/event-stream')
    if (!res.body) throw new Error('no body')
    const body = res.body
    const first = frames(body, 1)
    expect(await first).toEqual([{ event: 'open', data: '{}', retry: '5000' }])
    await tick()
    agents.setStatus(drift, 'needsYou')
    const [status] = await frames(body, 1)
    expect(status?.event).toBe('chat.status')
    expect(status?.id).toBe('0')
    expect(LiveEvent.parse(JSON.parse(status?.data ?? ''))).toEqual({
      source: 'test-mac/agents',
      seq: 0,
      type: 'chat.status',
      data: { chat: drift, status: 'needsYou' },
    })
    await body.cancel()
  })

  it('closes the subscription when the client goes, so the server then reads nothing', async () => {
    const agents = createFakeAgents(machine)
    const res = await createApp({ agents, owner }).request('/api/events', { headers: local })
    if (!res.body) throw new Error('no body')
    await frames(res.body, 1)
    await tick()
    expect(agents.subscriptions()).toBe(1)
    await res.body.cancel()
    await tick()
    expect(agents.subscriptions()).toBe(0)
    expect(agents.reads()).toBe(0)
  })

  it('leaves no subscription and no timer when the client goes before it reads the first frame', async () => {
    const agents = createFakeAgents(machine)
    const res = await createApp({ agents, owner }).request('/api/events', { headers: local })
    if (!res.body) throw new Error('no body')
    await res.body.cancel()
    await tick()
    await tick()
    expect(agents.subscriptions()).toBe(0)
  })

  it('ends the stream when the agents stop answering', async () => {
    const agents = createFakeAgents(machine)
    const res = await createApp({ agents, owner }).request('/api/events', { headers: local })
    if (!res.body) throw new Error('no body')
    await frames(res.body, 1)
    await tick()
    agents.endAll({ reason: 'unreachable', message: 'gone' })
    const reader = res.body.getReader()
    let done = false
    while (!done) done = (await reader.read()).done
    expect(done).toBe(true)
  })

  it('refuses a proxied request with no login and another login before it subscribes', async () => {
    const agents = createFakeAgents(machine)
    const app = createApp({ agents, owner })
    const tailnet = { Host: 'mac.tailnet.example', 'X-Forwarded-For': '203.0.113.2' }
    for (const headers of [tailnet, { ...tailnet, 'Tailscale-User-Login': 'someone@example.com' }]) {
      const res = await app.request('/api/events', { headers })
      expect(res.status).toBe(403)
    }
    expect(agents.subscriptions()).toBe(0)
  })
})
