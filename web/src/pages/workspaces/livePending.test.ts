import type { TranscriptEntry } from '@bridge/contract'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { type FakeTranscriptServer, fakeTranscriptServer } from '../../lib/fakeTranscriptServer.ts'
import { resetAllStores } from '../../state/resetStores.ts'
import { pendingViews, startPending } from './livePending.ts'
import { transcriptViews, watchTranscript } from './liveTranscript.ts'

// A pending send against a live chat's transcript (livePending.ts), with the contract-checked fake of the
// transcript routes (lib/fakeTranscriptServer.ts).
const chat = 'mac-mini/c1'
const user = (id: string, text: string): TranscriptEntry => ({ type: 'user', id, text, cut: false })
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
const entries = () => transcriptViews().get(chat)?.entries.length

afterEach(() => {
  for (const stop of stops.splice(0)) stop()
  vi.unstubAllGlobals()
  resetAllStores()
})

describe('a pending send', () => {
  it('waits for a read of a chat opened again, so an entry written while it was closed is not its prompt', async () => {
    const server = fakeTranscriptServer()
    server.set(chat, [user('u1', 'go')])
    stubFetch(server, 0)
    const stop = watchTranscript(chat, { retryMs: 50 })
    await expect.poll(entries).toBe(1)
    stop()
    // While the chat was closed, the owner sent the same text from the terminal.
    server.set(chat, [user('u1', 'go'), user('u2', 'again')])
    stubFetch(server, 200)
    stops.push(watchTranscript(chat, { retryMs: 50 }))
    // The chat shows its kept view at once; the owner sends before the read answers.
    expect(entries()).toBe(1)
    startPending(chat, 'again', []).sent()
    await expect.poll(entries).toBe(2)
    await settle()
    // u2 came before the send: the bubble waits for the send's own entry.
    expect(pendingViews(chat).map((view) => view.text)).toEqual(['again'])
  })
})
