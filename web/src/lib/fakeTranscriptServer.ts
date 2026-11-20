// A fake of the server's transcript routes (slice 3b), for tests: `GET
// /api/chats/:chat/transcript` and its event stream, with every answer and
// event checked against the contract (`TranscriptResponse`,
// `TranscriptChangedEvent`), so a test cannot send what the server would
// not. A test plugs `handle` into its `fetch` stub. `streams: 'missing'` is
// a server with the read and no stream route yet (backend 3b-2 alone): the
// stream answers 404 not-found, as Hono does for an unknown route.
import {
  maxTranscriptEntries,
  TranscriptChangedEvent,
  type TranscriptEntry,
  TranscriptResponse,
} from '@bridge/contract'

type Stream = { readonly chat: string; readonly control: ReadableStreamDefaultController<Uint8Array> }

const notFound = () =>
  new Response(JSON.stringify({ error: { kind: 'not-found', message: 'Not found', requestId: 'r-404' } }), {
    status: 404,
    headers: { 'content-type': 'application/json', 'X-Request-Id': 'r-404' },
  })

export type FakeTranscriptOptions = {
  /** `open`: the stream route answers; `missing`: it answers 404, as before backend 3b-3. */
  readonly streams?: 'open' | 'missing'
}

export function fakeTranscriptServer({ streams: mode = 'open' }: FakeTranscriptOptions = {}) {
  const encoder = new TextEncoder()
  const transcripts = new Map<string, TranscriptEntry[]>()
  const earlier = new Map<string, boolean>()
  const open: Stream[] = []
  /** The chat IDs of each transcript read, in order. */
  const reads: string[] = []
  /** The chat IDs of each stream open, in order. */
  const opens: string[] = []
  /** An answer in place of the read's, while set: such as a 503 with an error body. */
  let readAnswer: (() => Response) | undefined
  /** An answer in place of the stream's, while set: such as a 500. */
  let streamAnswer: (() => Response) | undefined
  let seq = 0

  const read = (chat: string) => {
    const entries = transcripts.get(chat) ?? []
    const body = TranscriptResponse.parse({
      chat,
      entries: entries.slice(-maxTranscriptEntries),
      earlier: (earlier.get(chat) ?? false) || entries.length > maxTranscriptEntries,
    })
    return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } })
  }

  const stream = (chat: string, signal: AbortSignal | null | undefined) => {
    let control: ReadableStreamDefaultController<Uint8Array> | undefined
    const body = new ReadableStream<Uint8Array>({
      start: (c) => {
        control = c
        c.enqueue(encoder.encode('event: open\nretry: 100\ndata: {}\n\n'))
      },
    })
    if (control !== undefined) open.push({ chat, control })
    signal?.addEventListener('abort', () => {
      const at = open.findIndex((s) => s.control === control)
      if (at !== -1) open.splice(at, 1)
      try {
        control?.error(new DOMException('The stream was closed.', 'AbortError'))
      } catch {
        // The stream had ended already.
      }
    })
    return new Response(body, { status: 200, headers: { 'content-type': 'text/event-stream' } })
  }

  return {
    reads,
    opens,
    /** The chats whose stream is open now, one item for each stream. */
    openStreams: () => open.map((s) => s.chat),
    /** Sets a chat's transcript, as its session file holds it; `older` marks entries before the ones kept. */
    set: (chat: string, entries: readonly TranscriptEntry[], older = false) => {
      transcripts.set(chat, [...entries])
      earlier.set(chat, older)
    },
    /** Changes a chat's transcript and sends `transcript.changed` with `entries` to each of its open streams. */
    push: (chat: string, entries: readonly TranscriptEntry[]) => {
      const now = [...(transcripts.get(chat) ?? [])]
      for (const entry of entries) {
        const at = now.findIndex((e) => e.id === entry.id)
        if (at === -1) now.push(entry)
        else now[at] = entry
      }
      transcripts.set(chat, now)
      const event = TranscriptChangedEvent.parse({
        source: 'mac-mini/transcripts',
        seq: seq++,
        type: 'transcript.changed',
        data: { chat, entries },
      })
      const text = `event: transcript.changed\nid: ${String(event.seq)}\ndata: ${JSON.stringify(event)}\n\n`
      for (const s of open) if (s.chat === chat) s.control.enqueue(encoder.encode(text))
    },
    /** Ends each open stream of `chat` with an error, as a dropped connection does. */
    drop: (chat: string) => {
      for (const s of open.filter((o) => o.chat === chat)) {
        open.splice(open.indexOf(s), 1)
        s.control.error(new TypeError('network error'))
      }
    },
    /** Answers each read with `answer` until it is set to undefined. */
    answerReads: (answer: (() => Response) | undefined) => {
      readAnswer = answer
    },
    /** Answers each stream open with `answer` until it is set to undefined. */
    answerStreams: (answer: (() => Response) | undefined) => {
      streamAnswer = answer
    },
    /** The answer to a request for `path`, or undefined when it is not a transcript route. */
    handle: (path: string, init?: RequestInit): Response | undefined => {
      const route = /^\/api\/chats\/([^/]+)\/transcript(\/events)?$/.exec(path)
      if (!route) return undefined
      const chat = decodeURIComponent(route[1] ?? '')
      if (route[2] === undefined) {
        reads.push(chat)
        return readAnswer?.() ?? read(chat)
      }
      opens.push(chat)
      if (streamAnswer !== undefined) return streamAnswer()
      return mode === 'missing' ? notFound() : stream(chat, init?.signal)
    },
  }
}

export type FakeTranscriptServer = ReturnType<typeof fakeTranscriptServer>
