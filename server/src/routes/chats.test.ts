// API tests of GET /api/chats/:chat/transcript/events (d-113): the app in
// process with the fake adapter, the SSE body read as it streams.
import { ChatId, ErrorBody, MachineId, maxPromptChars, TranscriptChangedEvent } from '@bridge/contract'
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

describe('POST /api/chats/:chat/prompt and /stop', () => {
  const promptPath = (id: string) => `/api/chats/${encodeURIComponent(id)}/prompt`
  const stopPath = (id: string) => `/api/chats/${encodeURIComponent(id)}/stop`
  const json = { ...local, 'Content-Type': 'application/json' }
  const secret = 'Deploy with token marker-5150'
  const setup = (agents = createFakeAgents(machine)) => {
    const logger = memoryLogger()
    const app = createApp({ agents, owner, log: logger.log })
    const post = (path: string, body: unknown, headers: Record<string, string> = json) =>
      app.request(path, { method: 'POST', headers, body: JSON.stringify(body) })
    return { agents, logger, post }
  }

  it('sends the prompt to that chat only, answers 204 and logs none of the text, while the chat works', async () => {
    const { agents, logger, post } = setup()
    const res = await post(promptPath(themes), { text: secret })
    expect(res.status).toBe(204)
    expect(await res.text()).toBe('')
    expect(agents.inputs()).toEqual([{ chat: themes, text: secret }])
    expect(JSON.stringify(logger.lines())).not.toContain('marker-5150')
  })

  it('refuses a body that is not JSON, an empty prompt, an extra field and a prompt over the limit, with no text in the error', async () => {
    const { agents, logger, post } = setup()
    const refused = [
      await post(promptPath(themes), { text: secret }, local),
      await post(promptPath(themes), { text: '  ' }),
      await post(promptPath(themes), { text: secret, chat: 'test-mac/drift-check' }),
      await post(promptPath(themes), { text: `${secret} ${'x'.repeat(maxPromptChars)}` }),
      await post(promptPath('no-machine'), { text: secret }),
    ]
    for (const res of refused) {
      expect(res.status).toBe(400)
      const body = await res.text()
      expect(ErrorBody.parse(JSON.parse(body)).error.kind).toBe('invalid-input')
      expect(body).not.toContain('marker-5150')
    }
    expect(agents.inputs()).toEqual([])
    expect(JSON.stringify(logger.lines())).not.toContain('marker-5150')
  })

  it("answers 404 for an unknown chat and 409 with the chat's state for a shell or a chat that waits for the owner", async () => {
    const { agents, post } = setup()
    const states = async (res: Response) => {
      const { error } = ErrorBody.parse(await res.json())
      return [res.status, error.kind === 'chat-not-ready' ? error.state : error.kind]
    }
    expect(await states(await post(promptPath('test-mac/none'), { text: 'Go on.' }))).toEqual([404, 'not-found'])
    expect(await states(await post(promptPath('test-mac/brain-git'), { text: 'ls' }))).toEqual([409, 'shell'])
    expect(await states(await post(promptPath('test-mac/drift-check'), { text: 'Go on.' }))).toEqual([409, 'needsYou'])
    expect(await states(await post(stopPath('test-mac/drift-check'), {}))).toEqual([409, 'notWorking'])
    expect(await states(await post(stopPath('test-mac/brain-git'), {}))).toEqual([409, 'shell'])
    expect(agents.inputs()).toEqual([])
  })

  it('stops a chat that works with 204, and takes a stop only as JSON', async () => {
    const { agents, post } = setup()
    expect((await post(stopPath(themes), {}, local)).status).toBe(400)
    expect((await post(stopPath(themes), {})).status).toBe(204)
    expect(agents.inputs()).toEqual([{ chat: themes, stop: true }])
  })

  it('answers 503 when herdr does not answer, with no prompt text in the log', async () => {
    const { logger, post } = setup(
      createFakeAgents(machine, { error: { reason: 'unreachable', message: 'herdr socket: ENOENT' } }),
    )
    expect((await post(promptPath(themes), { text: secret })).status).toBe(503)
    expect((await post(stopPath(themes), {})).status).toBe(503)
    expect(JSON.stringify(logger.lines())).not.toContain('marker-5150')
  })
})
