// API tests of GET /api/chats/:chat/transcript/events (d-113): the app in
// process with the fake adapter, the SSE body read as it streams.
import {
  ChatId,
  SplitChatResponse,
  ErrorBody,
  MachineId,
  WorkspaceId,
  maxCompactChars,
  maxPromptChars,
  TranscriptChangedEvent,
  ChatSkillsResponse,
} from '@bridge/contract'
import { testClient } from 'hono/testing'
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

  it('sends one not-found error and ends when the chat leaves the list (after /clear), with no transcript text', async () => {
    const logger = memoryLogger()
    const agents = createFakeAgents(machine)
    const res = await createApp({ agents, owner, log: logger.log }).request(eventsPath(themes), { headers: local })
    if (!res.body) throw new Error('no body')
    const reader: ReadableStreamDefaultReader<Uint8Array> = res.body.getReader()
    const decoder = new TextDecoder()
    let text = ''
    agents.renewSession(ChatId.parse(themes), ChatId.parse('test-mac/bridge-themes-2'))
    for (;;) {
      const read = await reader.read()
      if (read.done) break
      text += decoder.decode(read.value)
    }
    const error = /event: error\ndata: (.*)\n/.exec(text)?.[1]
    expect(ErrorBody.parse(JSON.parse(error ?? '')).error).toMatchObject({
      kind: 'not-found',
      message: 'no chat has this ID',
    })
    expect(text.match(/event: error/g)).toHaveLength(1)
    expect(text).not.toContain('transcript.changed')
    expect(agents.watchers()).toBe(0)
    expect(agents.subscriptions()).toBe(0)
    expect(logger.lines().some((l) => JSON.stringify(l).includes('notFound'))).toBe(true)
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

describe('POST /api/chats/:chat/command', () => {
  const commandPath = (id: string) => `/api/chats/${encodeURIComponent(id)}/command`
  const json = { ...local, 'Content-Type': 'application/json' }
  const setup = () => {
    const agents = createFakeAgents(machine)
    const logger = memoryLogger()
    const app = createApp({ agents, owner, log: logger.log })
    const post = (id: string, body: unknown, raw?: string) =>
      app.request(commandPath(id), { method: 'POST', headers: json, body: raw ?? JSON.stringify(body) })
    return { agents, logger, post }
  }
  const stateOf = async (res: Response) => {
    const { error } = ErrorBody.parse(await res.json())
    return error.kind === 'chat-not-ready' ? error.state : error.kind
  }

  it('sends /compact with its instructions and /clear to an idle Claude chat with 204, and logs no instructions', async () => {
    const { agents, logger, post } = setup()
    agents.setStatus(ChatId.parse(themes), 'idle')
    const instructions = 'keep the plan, token marker-5150'
    expect((await post(themes, { command: 'compact', instructions })).status).toBe(204)
    expect((await post(themes, { command: 'clear' })).status).toBe(204)
    expect(agents.inputs()).toEqual([
      { chat: themes, command: { command: 'compact', instructions } },
      { chat: themes, command: { command: 'clear' } },
    ])
    expect(JSON.stringify(logger.lines())).not.toContain('marker-5150')
    // The fake, as herdr, gives the pane a new session after /clear: a new chat ID with the same pane.
    const list = await agents.listWorkspaces()
    const chats = list.ok ? list.value.flatMap((w) => w.chats) : []
    expect(chats.map((c) => c.id)).not.toContain(themes)
    expect(chats.find((c) => c.pane === 'test-mac/pane-bridge-themes')?.id).toBe(`${themes}-c1`)
  })

  it('answers 409 working to a chat that works, noCommands to a Codex chat, shell, and 404 for no chat', async () => {
    const { agents, post } = setup()
    expect(await stateOf(await post(themes, { command: 'clear' }))).toBe('working')
    expect(await stateOf(await post('test-mac/drift-check', { command: 'clear' }))).toBe('noCommands')
    expect(await stateOf(await post('test-mac/brain-git', { command: 'compact' }))).toBe('shell')
    const none = await post('test-mac/no-such-chat', { command: 'clear' })
    expect(none.status).toBe(404)
    expect(agents.inputs()).toEqual([])
  })

  it('answers 400 to another command, an extra field, instructions of two lines or over the limit, with no text', async () => {
    const { agents, post } = setup()
    agents.setStatus(ChatId.parse(themes), 'idle')
    for (const body of [
      { command: 'model', model: 'opus' },
      { command: 'clear', instructions: 'marker-5150' },
      { command: 'compact', instructions: 'line one\nmarker-5150' },
      { command: 'compact', instructions: 'x'.repeat(maxCompactChars + 1) },
      {},
    ]) {
      const res = await post(themes, body)
      expect(res.status).toBe(400)
      expect(await res.text()).not.toContain('marker-5150')
    }
    expect(agents.inputs()).toEqual([])
  })

  it('takes the longest instructions when JSON writes each character as an escape', async () => {
    const { agents, post } = setup()
    agents.setStatus(ChatId.parse(themes), 'idle')
    const instructions = 'é'.repeat(maxCompactChars)
    const escaped = JSON.stringify({ command: 'compact', instructions }).replaceAll('é', '\\u00e9')
    expect((await post(themes, undefined, escaped)).status).toBe(204)
    expect(agents.inputs()).toEqual([{ chat: themes, command: { command: 'compact', instructions } }])
  })
})

describe('POST /api/chats/:chat/prompt and /stop', () => {
  const promptPath = (id: string) => `/api/chats/${encodeURIComponent(id)}/prompt`
  const stopPath = (id: string) => `/api/chats/${encodeURIComponent(id)}/stop`
  const clearPath = (id: string) => `/api/chats/${encodeURIComponent(id)}/input/clear`
  const json = { ...local, 'Content-Type': 'application/json' }
  const secret = 'Deploy with token marker-5150'
  const setup = (agents = createFakeAgents(machine)) => {
    const logger = memoryLogger()
    const app = createApp({ agents, owner, log: logger.log })
    const post = (path: string, body: unknown, headers: Record<string, string> = json, raw?: string) =>
      app.request(path, { method: 'POST', headers, body: raw ?? JSON.stringify(body) })
    return { agents, logger, post, app }
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
    agents.typeInput(ChatId.parse(themes), 'half a thought')
    expect(await states(await post(promptPath(themes), { text: 'Go on.' }))).toEqual([409, 'inputNotEmpty'])
    expect(agents.inputs()).toEqual([])
  })

  it("empties a chat's input box with 204, so the next prompt goes, and answers 409 for a shell or 404 for no chat", async () => {
    const { agents, post } = setup()
    const states = async (res: Response) => {
      const { error } = ErrorBody.parse(await res.json())
      return [res.status, error.kind === 'chat-not-ready' ? error.state : error.kind]
    }
    agents.typeInput(ChatId.parse(themes), 'marker-7301 half a thought')
    expect((await post(promptPath(themes), { text: 'Go on.' })).status).toBe(409)
    const cleared = await post(clearPath(themes), {})
    expect([cleared.status, await cleared.text()]).toEqual([204, ''])
    expect((await post(promptPath(themes), { text: 'Go on.' })).status).toBe(204)
    expect(await states(await post(clearPath('test-mac/brain-git'), {}))).toEqual([409, 'shell'])
    expect(await states(await post(clearPath('test-mac/none'), {}))).toEqual([404, 'not-found'])
    expect(await states(await post(clearPath(themes), { text: 'x' }))).toEqual([400, 'invalid-input'])
  })

  it('answers 409 notSubmitted when the chat did not take the prompt, and the next prompt goes', async () => {
    const { agents, post } = setup()
    agents.dropNextEnter(ChatId.parse(themes))
    const res = await post(promptPath(themes), { text: 'marker-7302 Go on.' })
    const body = await res.text()
    expect(res.status).toBe(409)
    expect(ErrorBody.parse(JSON.parse(body)).error).toMatchObject({ kind: 'chat-not-ready', state: 'notSubmitted' })
    expect(body).not.toContain('marker-7302')
    expect((await post(promptPath(themes), { text: 'Go on.' })).status).toBe(204)
    expect(agents.inputs()).toEqual([{ chat: themes, text: 'Go on.' }])
  })

  it('takes the longest prompt when JSON writes each character as a \\u escape', async () => {
    const { agents, post } = setup()
    const text = 'é'.repeat(maxPromptChars)
    const escaped = JSON.stringify({ text }).replaceAll('é', '\\u00e9')
    expect((await post(promptPath(themes), undefined, json, escaped)).status).toBe(204)
    expect(agents.inputs()).toEqual([{ chat: themes, text }])
  })

  it('answers 400, not 500, to a body that is not valid JSON, with no text in the error', async () => {
    const { agents, post } = setup()
    for (const path of [promptPath(themes), stopPath(themes)]) {
      const res = await post(path, undefined, json, '{"text": "marker-5150')
      expect(res.status).toBe(400)
      expect(await res.text()).not.toContain('marker-5150')
    }
    expect(agents.inputs()).toEqual([])
  })

  it("lets the typed client send a prompt and a stop with the contract's shapes", async () => {
    const { agents, app } = setup()
    const chats = testClient(app, undefined, undefined, { headers: local }).api.chats[':chat']
    // The client puts the param in the path as it is, so the caller encodes the "/" of the chat ID.
    const chat = encodeURIComponent(themes)
    expect((await chats.prompt.$post({ param: { chat }, json: { text: 'Go on.' } })).status).toBe(204)
    expect((await chats.stop.$post({ param: { chat }, json: {} })).status).toBe(204)
    expect(agents.inputs()).toEqual([
      { chat: themes, text: 'Go on.' },
      { chat: themes, stop: true },
    ])
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

describe('POST /api/chats/:chat/focus, /zoom, /swap and /close (W2)', () => {
  const drift = 'test-mac/drift-check'
  const shell = 'test-mac/brain-git'
  const brain = WorkspaceId.parse('test-mac/omni-brain')
  const json = { ...local, 'Content-Type': 'application/json' }
  const setup = () => {
    const agents = createFakeAgents(machine)
    const app = createApp({ agents, owner, log: memoryLogger().log })
    const post = (id: string, write: string, body: unknown) =>
      app.request(`/api/chats/${encodeURIComponent(id)}/${write}`, {
        method: 'POST',
        headers: json,
        body: JSON.stringify(body),
      })
    const tab = async () => {
      const read = await agents.readLayout(brain)
      return read.ok ? read.value?.tabs[0] : undefined
    }
    return { agents, post, tab }
  }
  const stateOf = async (res: Response) => {
    const { error } = ErrorBody.parse(await res.json())
    return error.kind === 'chat-not-ready' ? error.state : error.kind
  }

  it('focuses a pane and zooms its tab in and out with 204, and answers 409 singlePane and 404', async () => {
    const { post, tab } = setup()
    expect((await post(drift, 'focus', {})).status).toBe(204)
    expect((await tab())?.focusedChat).toBe(drift)
    expect((await post(themes, 'zoom', { zoomed: true })).status).toBe(204)
    expect(await tab()).toMatchObject({ focusedChat: themes, zoomed: true })
    expect((await post(themes, 'zoom', { zoomed: false })).status).toBe(204)
    expect((await tab())?.zoomed).toBe(false)
    expect(await stateOf(await post(shell, 'zoom', { zoomed: true }))).toBe('singlePane')
    expect((await post('test-mac/no-such-chat', 'focus', {})).status).toBe(404)
  })

  it('swaps two panes of one tab with 204; another tab is 409 otherTab and the chat itself 400', async () => {
    const { post, tab } = setup()
    expect((await post(themes, 'swap', { with: drift })).status).toBe(204)
    expect((await tab())?.chats.map((c) => c.id)).toEqual([drift, themes])
    expect(await stateOf(await post(themes, 'swap', { with: shell }))).toBe('otherTab')
    expect(await stateOf(await post(themes, 'swap', { with: themes }))).toBe('invalid-input')
    expect((await post(themes, 'swap', { with: 'test-mac/no-such-chat' })).status).toBe(404)
    expect((await tab())?.chats.map((c) => c.id)).toEqual([drift, themes])
  })

  it('moves a pane only to another tab of its workspace: its own tab is 409 sameTab, another tab 404', async () => {
    const { post } = setup()
    expect(await stateOf(await post(themes, 'move', { tab: 'test-mac/omni-brain:t1', direction: 'row' }))).toBe(
      'sameTab',
    )
    expect((await post(themes, 'move', { tab: 'test-mac/omni-brain:t9', direction: 'row' })).status).toBe(404)
    expect(
      (await post('test-mac/no-such-chat', 'move', { tab: 'test-mac/omni-brain:t1', direction: 'row' })).status,
    ).toBe(404)
    for (const body of [{ tab: 'test-mac/omni-brain:t1' }, { tab: 'test-mac/omni-brain:t1', direction: 'row', at: 1 }])
      expect((await post(themes, 'move', body)).status).toBe(400)
  })

  it('closes a pane only with a confirm that names its chat, and never one that works or waits', async () => {
    const { agents, post, tab } = setup()
    agents.setStatus(ChatId.parse(themes), 'idle')
    for (const body of [{}, { confirm: drift }, { confirm: 'no-machine' }]) {
      expect((await post(themes, 'close', body)).status).toBe(400)
    }
    expect((await tab())?.chats.map((c) => c.id)).toContain(themes)
    agents.setStatus(ChatId.parse(themes), 'working')
    expect(await stateOf(await post(themes, 'close', { confirm: themes }))).toBe('working')
    expect(await stateOf(await post(drift, 'close', { confirm: drift }))).toBe('needsYou')
    agents.setStatus(ChatId.parse(themes), 'idle')
    expect((await post(themes, 'close', { confirm: themes })).status).toBe(204)
    expect((await tab())?.chats.map((c) => c.id)).toEqual([drift])
    expect((await post(shell, 'close', { confirm: shell })).status).toBe(204)
    expect((await post(themes, 'close', { confirm: themes })).status).toBe(404)
  })

  it('splits a pane with 201 and the new shell chat, beside the chat in the layout', async () => {
    const { post, tab } = setup()
    const res = await post(themes, 'split', { direction: 'column' })
    expect(res.status).toBe(201)
    const { chat } = SplitChatResponse.parse(await res.json())
    expect((await tab())?.chats.map((c) => [c.id, c.kind])).toEqual([
      [themes, 'claude'],
      [chat, 'shell'],
      [drift, 'codex'],
    ])
    expect((await post('test-mac/no-such-chat', 'split', { direction: 'row' })).status).toBe(404)
    expect((await post(themes, 'split', { direction: 'right' })).status).toBe(400)
  })

  it("splits only the chat's pane, in the asked direction, and keeps the ratios that were set", async () => {
    const { agents, post, tab } = setup()
    const app = createApp({ agents, owner, log: memoryLogger().log })
    const ratio = await app.request(`/api/workspaces/${encodeURIComponent(brain)}/layout/ratio`, {
      method: 'POST',
      headers: json,
      body: JSON.stringify({ tab: 'test-mac/omni-brain:t1', path: [], ratio: 0.3 }),
    })
    expect(ratio.status).toBe(204)
    const res = await post(drift, 'split', { direction: 'column' })
    const { chat } = SplitChatResponse.parse(await res.json())
    expect((await tab())?.root).toEqual({
      kind: 'split',
      direction: 'row',
      ratio: 0.3,
      first: { kind: 'pane', chat: themes },
      second: {
        kind: 'split',
        direction: 'column',
        ratio: 0.5,
        first: { kind: 'pane', chat: drift },
        second: { kind: 'pane', chat },
      },
    })
    expect(
      (
        await app.request(`/api/workspaces/${encodeURIComponent(brain)}/layout/ratio`, {
          method: 'POST',
          headers: json,
          body: JSON.stringify({ tab: 'test-mac/omni-brain:t1', path: ['second'], ratio: 0.7 }),
        })
      ).status,
    ).toBe(204)
    const second = (await tab())?.root
    expect(second?.kind === 'split' && second.second.kind === 'split' ? second.second.ratio : undefined).toBe(0.7)
  })

  it('sets the ratio of a split of a tab of the workspace with 204, and 404 for another tab or no split', async () => {
    const { agents, tab } = setup()
    const app = createApp({ agents, owner, log: memoryLogger().log })
    const ratio = (workspace: string, body: unknown) =>
      app.request(`/api/workspaces/${encodeURIComponent(workspace)}/layout/ratio`, {
        method: 'POST',
        headers: json,
        body: JSON.stringify(body),
      })
    const t1 = 'test-mac/omni-brain:t1'
    expect((await ratio(brain, { tab: t1, path: [], ratio: 0.3 })).status).toBe(204)
    const root = (await tab())?.root
    expect(root?.kind === 'split' ? root.ratio : undefined).toBe(0.3)
    expect((await ratio(brain, { tab: t1, path: ['first'], ratio: 0.3 })).status).toBe(404)
    expect((await ratio(brain, { tab: 'test-mac/omni:t1', path: [], ratio: 0.3 })).status).toBe(404)
    expect((await ratio(brain, { tab: t1, path: [], ratio: 0.95 })).status).toBe(400)
    expect((await ratio(brain, { tab: t1, path: ['left'], ratio: 0.5 })).status).toBe(400)
    expect((await ratio('no-machine', { tab: t1, path: [], ratio: 0.5 })).status).toBe(400)
  })

  it('answers 400 to a body that is not the contract', async () => {
    const { post, tab } = setup()
    for (const [write, body] of [
      ['focus', { chat: drift }],
      ['zoom', {}],
      ['zoom', { zoomed: 'yes' }],
      ['swap', {}],
      ['swap', { with: drift, also: themes }],
      ['close', { confirm: themes, force: true }],
    ] as const) {
      expect((await post(themes, write, body)).status).toBe(400)
    }
    expect(await tab()).toMatchObject({ focusedChat: themes, zoomed: false })
  })
})

describe('GET /api/chats/:chat/skills', () => {
  const skillsPath = (id: string) => `/api/chats/${encodeURIComponent(id)}/skills`

  it('gives a chat\'s "/" list in the contract\'s shape, the built-in commands first', async () => {
    const app = createApp({ agents: createFakeAgents(machine), owner, log: memoryLogger().log })
    const res = await app.request(skillsPath(themes), { headers: local })
    expect(res.status).toBe(200)
    const body = ChatSkillsResponse.parse(await res.json())
    expect(body.chat).toBe(themes)
    expect(body.skills.map((s) => s.name)).toEqual(['compact', 'clear', 'model', 'effort', 'writer'])
  })

  it('answers 404 for an unknown chat and 400 for an ID with no machine', async () => {
    const app = createApp({ agents: createFakeAgents(machine), owner, log: memoryLogger().log })
    expect((await app.request(skillsPath('test-mac/nobody'), { headers: local })).status).toBe(404)
    expect((await app.request(skillsPath('nobody'), { headers: local })).status).toBe(400)
  })
})
