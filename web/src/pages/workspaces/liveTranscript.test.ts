// The live transcript (slice 3b): the merge by entry ID, the order of the
// stream and the read, a reconnect that reads again, the earlier and cut
// lines, the 404 of a server with no stream route yet, and what reaches
// report(). The server is the contract-checked fake (lib/fakeTranscriptServer.ts).
import type { TranscriptEntry } from '@bridge/contract'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearReports, getReports } from '../../errors/reporter.ts'
import { type FakeTranscriptServer, fakeTranscriptServer } from '../../lib/fakeTranscriptServer.ts'
import { workbench } from './states/workbench.ts'
import {
  chatEntryOf,
  mergeEntries,
  retryTranscript,
  transcriptText,
  transcriptViews,
  watchTranscript,
  withTranscripts,
} from './liveTranscript.ts'

type UserEntry = Extract<TranscriptEntry, { type: 'user' }>
type AssistantEntry = Extract<TranscriptEntry, { type: 'assistant' }>

const chat = 'mac-mini/c1'
const user = (id: string, text: string): UserEntry => ({ type: 'user', id, text, cut: false })
const reply = (id: string, text: string, cut = false): AssistantEntry => ({ type: 'assistant', id, text, cut })
const tool = (id: string, running: boolean, target = 'pnpm'): TranscriptEntry => ({
  type: 'tool',
  id,
  name: 'Bash',
  target,
  running,
})

const settle = (ms = 30) => new Promise((resolve) => setTimeout(resolve, ms))

/** The page's fetch, answered by `server`; each read waits `readDelayMs` first. */
function stubFetch(server: FakeTranscriptServer, readDelayMs: number) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      const path = new URL(url, window.location.origin).pathname
      if (readDelayMs > 0 && !path.endsWith('/events')) await settle(readDelayMs)
      const answer = server.handle(path, init)
      if (answer === undefined) throw new TypeError(`no stub for ${url}`)
      return answer
    }),
  )
}

const stops: (() => void)[] = []
const watch = (server: FakeTranscriptServer, readDelayMs = 0) => {
  stubFetch(server, readDelayMs)
  const stop = watchTranscript(chat, { retryMs: 50 })
  stops.push(stop)
  return stop
}
const view = () => transcriptViews().get(chat)
const ids = () => view()?.entries.map((e) => e.id)

afterEach(() => {
  for (const stop of stops.splice(0)) stop()
  vi.unstubAllGlobals()
  clearReports()
})

describe('mergeEntries', () => {
  it('replaces an entry with a known ID in its place and adds a new ID at the end, in order', () => {
    const before = [user('u1', 'go'), tool('t1', true), reply('a1', 'one')]
    const { entries, dropped } = mergeEntries(before, [reply('a2', 'two'), tool('t1', false), user('u2', 'more')])
    expect(entries.map((e) => e.id)).toEqual(['u1', 't1', 'a1', 'a2', 'u2'])
    expect(entries[1]).toEqual(tool('t1', false))
    expect(dropped).toBe(0)
    // The input stays as it was.
    expect(before[1]).toEqual(tool('t1', true))
  })

  it('applies the same change twice as once', () => {
    const once = mergeEntries([user('u1', 'go')], [reply('a1', 'done')]).entries
    expect(mergeEntries(once, [reply('a1', 'done')]).entries).toEqual(once)
  })

  it('keeps the last 500 entries and says how many older ones went', () => {
    const many = Array.from({ length: 500 }, (_, i) => user(`u${String(i)}`, 'x'))
    const { entries, dropped } = mergeEntries(many, [user('new', 'y')])
    expect(entries).toHaveLength(500)
    expect(entries[0]?.id).toBe('u1')
    expect(entries.at(-1)?.id).toBe('new')
    expect(dropped).toBe(1)
  })
})

describe('watchTranscript', () => {
  it('opens the stream before it reads, shows the entries and applies each change by ID', async () => {
    const server = fakeTranscriptServer()
    server.set(chat, [user('u1', 'Fix the build'), tool('t1', true)])
    watch(server)
    await expect.poll(ids).toEqual(['u1', 't1'])
    expect(server.opens).toEqual([chat])
    expect(server.reads).toEqual([chat])
    server.push(chat, [tool('t1', false), reply('a1', 'Done.')])
    await expect.poll(ids).toEqual(['u1', 't1', 'a1'])
    expect(view()?.entries[1]).toEqual(tool('t1', false))
    expect(view()?.problem).toBeUndefined()
    expect(getReports()).toEqual([])
  })

  it("applies a status change's tool entries in place: a running tool stops, and no entry is added", async () => {
    const server = fakeTranscriptServer()
    server.set(chat, [user('u1', 'go'), tool('t1', true, 'pnpm test'), tool('t2', true, 'pnpm lint')])
    watch(server)
    await expect.poll(ids).toEqual(['u1', 't1', 't2'])
    // The chat stops working: the server sends the changed tool entries with running false (backend 3b-3).
    server.push(chat, [tool('t1', false, 'pnpm test'), tool('t2', false, 'pnpm lint')])
    await expect
      .poll(() => view()?.entries.map((e) => (e.type === 'tool' ? e.running : undefined)))
      .toEqual([undefined, false, false])
    expect(ids()).toEqual(['u1', 't1', 't2'])
    expect(view()?.problem).toBeUndefined()
  })

  it('applies an event that came before the read answered after the read', async () => {
    const server = fakeTranscriptServer()
    server.set(chat, [user('u1', 'go')])
    watch(server, 60)
    await expect.poll(() => server.openStreams()).toEqual([chat])
    // The stream is open and the read still runs: the event waits for the read's answer.
    server.push(chat, [reply('a1', 'first')])
    await expect.poll(ids).toEqual(['u1', 'a1'])
  })

  it('shows the drop under the entries, connects again after the retry time and reads again', async () => {
    const server = fakeTranscriptServer()
    server.set(chat, [user('u1', 'go')])
    watch(server)
    await expect.poll(ids).toEqual(['u1'])
    server.drop(chat)
    await expect.poll(() => view()?.problem).toBe(transcriptText.dropped)
    // The entries stay while it connects again.
    expect(ids()).toEqual(['u1'])
    // A change while the stream was down comes with the read again.
    server.set(chat, [user('u1', 'go'), reply('a1', 'while down')])
    await expect.poll(() => server.reads.length).toBe(2)
    await expect.poll(ids).toEqual(['u1', 'a1'])
    expect(view()?.problem).toBeUndefined()
    expect(server.opens).toEqual([chat, chat])
    expect(getReports().map((r) => r.error.message)).toEqual([
      'A chat transcript stream missed: ended (chat mac-mini/c1)',
    ])
  })

  it('shows a failed watch (an error event) as one outage: the line while it connects again, a read, one report', async () => {
    const server = fakeTranscriptServer()
    server.set(chat, [user('u1', 'go')])
    watch(server)
    await expect.poll(ids).toEqual(['u1'])
    // The first connection after the error event fails too: still the same outage.
    server.answerStreams(
      () =>
        new Response(
          JSON.stringify({ error: { kind: 'herdr-unavailable', message: 'herdr is down', requestId: 'r-5' } }),
          { status: 503 },
        ),
    )
    server.fail(chat)
    await expect.poll(() => view()?.problem).toBe(transcriptText.dropped)
    expect(ids()).toEqual(['u1'])
    await expect.poll(() => server.opens.length).toBeGreaterThanOrEqual(2)
    server.answerStreams(undefined)
    server.set(chat, [user('u1', 'go'), reply('a1', 'after the outage')])
    await expect.poll(ids).toEqual(['u1', 'a1'])
    expect(view()?.problem).toBeUndefined()
    await expect.poll(() => server.openStreams()).toEqual([chat])
    expect(getReports()).toHaveLength(1)
    expect(getReports()[0]?.error.message).toBe(
      'A chat transcript stream missed: ended herdr-unavailable (chat mac-mini/c1)',
    )
    // A later failure is a new outage, with its own report.
    server.fail(chat)
    await expect.poll(() => getReports().length).toBe(2)
  })

  it('marks a transcript with earlier entries and keeps it marked once the cap drops one', async () => {
    const server = fakeTranscriptServer()
    server.set(chat, [user('u1', 'go')], true)
    watch(server)
    await expect.poll(() => view()?.earlier).toBe(true)
    const data = withTranscripts(liveData(), transcriptViews())
    expect(chatPane(data)?.earlier).toBe('Earlier entries not live yet')
  })

  it('shows a cut message or reply with the cut line, and the agent name and Copy from the chat', () => {
    expect(chatEntryOf({ ...user('u1', 'long'), cut: true }, 'claude')).toEqual({
      type: 'user',
      text: 'long',
      cut: 'Cut — full text not live yet',
    })
    expect(chatEntryOf(reply('a1', 'long', true), 'codex')).toEqual({
      type: 'assistant',
      kind: 'codex',
      name: 'Codex',
      text: 'long',
      copy: 'Copy',
      cut: 'Cut — full text not live yet',
    })
    expect(chatEntryOf(reply('a2', 'short'), 'claude')).toEqual({
      type: 'assistant',
      kind: 'claude',
      name: 'Claude',
      text: 'short',
      copy: 'Copy',
    })
    expect(chatEntryOf(tool('t1', true), 'claude')).toEqual({
      type: 'tool',
      name: 'Bash',
      target: 'pnpm',
      running: true,
    })
  })

  it('reads once with no line and no report when the stream route answers 404, and does not connect again', async () => {
    const server = fakeTranscriptServer({ streams: 'missing' })
    server.set(chat, [user('u1', 'go'), reply('a1', 'done')])
    watch(server)
    await expect.poll(ids).toEqual(['u1', 'a1'])
    // Several retry times later: still one open and one read.
    await settle(200)
    expect(server.opens).toEqual([chat])
    expect(server.reads).toEqual([chat])
    expect(view()?.problem).toBeUndefined()
    expect(getReports()).toEqual([])
  })

  it('shows the line and reports once for a 404 stream when the read says the chat is unknown (404)', async () => {
    // Both 404s are ErrorBody `not-found`: the read decides whether the chat exists, never the message.
    const server = fakeTranscriptServer({ streams: 'missing' })
    server.answerReads(
      () =>
        new Response(
          JSON.stringify({ error: { kind: 'not-found', path: '/api/chats/x', message: 'no chat', requestId: 'r-4' } }),
          { status: 404 },
        ),
    )
    watch(server)
    await expect.poll(() => view()?.problem).toBe('Transcript not live — status 404')
    await settle(200)
    expect(server.opens).toEqual([chat])
    expect(server.reads).toEqual([chat])
    expect(getReports().map((r) => r.error.message)).toEqual([
      'A chat transcript read missed: status 404 not-found (chat mac-mini/c1)',
    ])
  })

  it('reads again when the chat opens again after a 404 stream', async () => {
    const server = fakeTranscriptServer({ streams: 'missing' })
    server.set(chat, [user('u1', 'go')])
    const stop = watch(server)
    await expect.poll(ids).toEqual(['u1'])
    stop()
    expect(view()).toBeUndefined()
    watch(server)
    await expect.poll(() => server.reads.length).toBe(2)
    await expect.poll(ids).toEqual(['u1'])
  })

  it('shows a missed read with its kind, reports it once for the outage, and Retry reads again', async () => {
    const server = fakeTranscriptServer()
    server.set(chat, [user('u1', 'go')])
    server.answerReads(herdrDown)
    watch(server)
    await expect.poll(() => view()?.problem).toBe('Transcript not live — herdr-unavailable')
    expect(view()?.entries).toEqual([])
    // The stream closes with the missed read; the page waits for Retry.
    await expect.poll(() => server.openStreams()).toEqual([])
    retryTranscript(chat)
    await expect.poll(() => server.reads.length).toBe(2)
    await expect.poll(() => view()?.problem).toBe('Transcript not live — herdr-unavailable')
    expect(getReports().map((r) => r.error.message)).toEqual([
      'A chat transcript read missed: herdr-unavailable (chat mac-mini/c1)',
    ])
    server.answerReads(undefined)
    retryTranscript(chat)
    await expect.poll(ids).toEqual(['u1'])
    expect(view()?.problem).toBeUndefined()
    expect(getReports()).toHaveLength(1)
  })

  it('shows a refused stream with its status and does not connect again until Retry', async () => {
    const server = fakeTranscriptServer()
    server.answerStreams(() => new Response('{}', { status: 403 }))
    watch(server)
    await expect.poll(() => view()?.problem).toBe('Transcript updates stopped — 403')
    await settle(200)
    expect(server.opens).toHaveLength(1)
    expect(getReports().map((r) => r.error.message)).toEqual([
      'A chat transcript stream missed: status 403 (chat mac-mini/c1)',
    ])
  })

  it('connects again after a 5xx stream, with the drop line and one report', async () => {
    const server = fakeTranscriptServer()
    server.set(chat, [user('u1', 'go')])
    server.answerStreams(() => new Response('Bad Gateway', { status: 502 }))
    watch(server)
    await expect.poll(() => view()?.problem).toBe(transcriptText.dropped)
    await expect.poll(() => server.opens.length).toBeGreaterThan(2)
    server.answerStreams(undefined)
    await expect.poll(ids).toEqual(['u1'])
    expect(view()?.problem).toBeUndefined()
    expect(getReports()).toHaveLength(1)
  })

  it('opens one stream for a chat that two panes show, and closes it when the last one goes', async () => {
    const server = fakeTranscriptServer()
    const first = watch(server)
    const second = watch(server)
    await expect.poll(() => server.openStreams()).toEqual([chat])
    first()
    expect(server.openStreams()).toEqual([chat])
    second()
    await expect.poll(() => server.openStreams()).toEqual([])
    expect(view()).toBeUndefined()
  })
})

describe('what reaches report()', () => {
  it('names only the miss kind, the status and the chat: no transcript text, tool target or server message', async () => {
    const secret = 'SECRET-transcript-text'
    const target = '~/private/SECRET-target'
    const serverText = 'SECRET-server-message'
    const server = fakeTranscriptServer()
    server.set(chat, [user('u1', secret), tool('t1', true, target)])
    watch(server)
    await expect.poll(ids).toEqual(['u1', 't1'])
    server.push(chat, [reply('a1', secret)])
    // A drop, then a read that misses with the server's message, then a stream that sends an event it cannot read.
    server.drop(chat)
    server.answerReads(() => errorAnswer(500, 'internal', serverText))
    await expect.poll(() => getReports().length).toBe(1)
    server.answerReads(undefined)
    retryTranscript(chat)
    await expect.poll(() => view()?.problem).toBeUndefined()
    server.push(chat, [reply('a2', secret)])
    const reports = getReports()
    expect(reports.length).toBeGreaterThan(0)
    for (const r of reports) {
      const said = JSON.stringify([r.error.name, r.error.message, r.error.stack, r.componentStack, r.error.cause])
      for (const hidden of [secret, target, serverText, 'SECRET']) expect(said).not.toContain(hidden)
    }
    expect(reports[0]?.error.message).toMatch(
      /^A chat transcript (stream|read) missed: [a-z-]+( \d+)?( [a-z-]+)? \(chat mac-mini\/c1\)$/,
    )
  })
})

const herdrDown = () => errorAnswer(503, 'herdr-unavailable', 'herdr is not running')

function errorAnswer(status: number, kind: string, message: string) {
  return new Response(JSON.stringify({ error: { kind, message, requestId: 'r-1' } }), { status })
}

/** The workbench state with its first chat pane a live chat of `chat`. */
function liveData() {
  const data = workbench.data
  let first = true
  return {
    ...data,
    panes: data.panes.map((p) => {
      if (p.type !== 'chat' || !first) return p
      first = false
      return { ...p, entries: [], liveChat: chat }
    }),
  }
}

const chatPane = (data: ReturnType<typeof withTranscripts>) => {
  const found = data.panes.find((p) => p.type === 'chat' && p.liveChat === chat)
  return found?.type === 'chat' ? found : undefined
}
