// A fake of the server's transcript routes (slice 3b), for tests: `GET
// /api/chats/:chat/transcript` and its event stream, with every answer and
// event checked against the contract (`TranscriptResponse`,
// `TranscriptChangedEvent`), so a test cannot send what the server would
// not. A test plugs `handle` into its `fetch` stub. `streams: 'missing'` is
// a server with the read and no stream route yet (backend 3b-2 alone): the
// stream answers 404 not-found, as Hono does for an unknown route.
//
// W1: it also takes a chat's Send and Stop (`POST /api/chats/:chat/prompt`
// with `{ text }`, `POST /api/chats/:chat/stop` with `{}`). As the server's
// fake agents do, it only records them and answers 204: the prompt reaches
// the transcript only when the test pushes it. A body or a content type the
// contract refuses answers 400 invalid-input, and every error answer is
// checked against the contract's error body (`PromptErrorBody`, a local
// mirror until backend W1-2 merges).
import {
  ErrorBody,
  maxTranscriptEntries,
  TranscriptChangedEvent,
  type TranscriptEntry,
  TranscriptResponse,
} from '@bridge/contract'
import { PromptErrorBody, SendPromptRequest, StopChatRequest } from './promptContract.ts'

type Stream = { readonly chat: string; readonly control: ReadableStreamDefaultController<Uint8Array> }

const notFound = (path: string) =>
  new Response(JSON.stringify({ error: { kind: 'not-found', path, message: 'Not found', requestId: 'r-404' } }), {
    status: 404,
    headers: { 'content-type': 'application/json', 'X-Request-Id': 'r-404' },
  })

/** An answer the test picks for a send or a stop: such as a 503, or one that waits until the test ends it. */
type ActionAnswer = () => Response | Promise<Response>

/** An error answer of a send or a stop, its body checked against the contract. */
export function errorAnswer(error: PromptErrorBody['error'], status: number): Response {
  return new Response(JSON.stringify(PromptErrorBody.parse({ error })), {
    status,
    headers: { 'content-type': 'application/json', 'X-Request-Id': error.requestId },
  })
}

const readBody = (init: RequestInit | undefined): unknown => {
  try {
    return typeof init?.body === 'string' ? JSON.parse(init.body) : undefined
  } catch {
    return undefined
  }
}

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
  /** Each send the server took, in order: the chat and the text. */
  const prompts: { chat: string; text: string }[] = []
  /** The chat of each stop the server took, in order. */
  const stops: string[] = []
  /** Each send or stop the page posted, taken or not: its chat and route. */
  const posts: { chat: string; route: 'prompt' | 'stop' }[] = []
  let promptAnswer: ActionAnswer | undefined
  let stopAnswer: ActionAnswer | undefined

  /** A send or a stop: the contract's checks, then the test's answer or 204. */
  const act = (chat: string, route: 'prompt' | 'stop', init: RequestInit | undefined) => {
    posts.push({ chat, route })
    const json = new Headers(init?.headers).get('content-type') === 'application/json'
    const body = readBody(init)
    const parsed = route === 'prompt' ? SendPromptRequest.safeParse(body) : StopChatRequest.safeParse(body)
    if (!json || !parsed.success)
      return errorAnswer(
        { kind: 'invalid-input', issues: ['the body'], message: 'Invalid input', requestId: 'r-400' },
        400,
      )
    const answer = route === 'prompt' ? promptAnswer : stopAnswer
    if (answer !== undefined) return answer()
    if (route === 'prompt') {
      const text = SendPromptRequest.parse(body).text
      prompts.push({ chat, text })
    } else stops.push(chat)
    return new Response(null, { status: 204 })
  }

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
    // The page's reader can end the stream first; then there is nothing to close.
    let ended = false
    const body = new ReadableStream<Uint8Array>({
      start: (c) => {
        control = c
        c.enqueue(encoder.encode('event: open\nretry: 100\ndata: {}\n\n'))
      },
      cancel: () => {
        ended = true
      },
    })
    if (control !== undefined) open.push({ chat, control })
    signal?.addEventListener('abort', () => {
      const at = open.findIndex((s) => s.control === control)
      if (at !== -1) open.splice(at, 1)
      if (ended) return
      ended = true
      control?.error(new DOMException('The stream was closed.', 'AbortError'))
    })
    return new Response(body, { status: 200, headers: { 'content-type': 'text/event-stream' } })
  }

  return {
    reads,
    opens,
    prompts,
    stops,
    posts,
    /** Answers each send with `answer` until it is set to undefined; the send is not recorded in `prompts`. */
    answerPrompts: (answer: ActionAnswer | undefined) => {
      promptAnswer = answer
    },
    /** Answers each stop with `answer` until it is set to undefined; the stop is not recorded in `stops`. */
    answerStops: (answer: ActionAnswer | undefined) => {
      stopAnswer = answer
    },
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
    /**
     * Ends each open stream of `chat` as the server does when its herdr watch fails (backend 3b-3): one `error` event
     * with an ErrorBody of `kind`, then the end of the stream.
     */
    fail: (chat: string, kind: 'herdr-unavailable' | 'herdr-bad-reply' | 'internal' = 'herdr-unavailable') => {
      const body = ErrorBody.parse({ error: { kind, message: 'herdr stopped answering', requestId: 'r-watch' } })
      const text = `event: error\ndata: ${JSON.stringify(body)}\n\n`
      for (const s of open.filter((o) => o.chat === chat)) {
        open.splice(open.indexOf(s), 1)
        s.control.enqueue(encoder.encode(text))
        s.control.close()
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
    /** The answer to a request for `path`, or undefined when it is not a transcript, send or stop route. */
    handle: (path: string, init?: RequestInit): Response | Promise<Response> | undefined => {
      const action = /^\/api\/chats\/([^/]+)\/(prompt|stop)$/.exec(path)
      if (action !== null && init?.method === 'POST')
        return act(decodeURIComponent(action[1] ?? ''), action[2] === 'stop' ? 'stop' : 'prompt', init)
      const route = /^\/api\/chats\/([^/]+)\/transcript(\/events)?$/.exec(path)
      if (!route) return undefined
      const chat = decodeURIComponent(route[1] ?? '')
      if (route[2] === undefined) {
        reads.push(chat)
        return readAnswer?.() ?? read(chat)
      }
      opens.push(chat)
      if (streamAnswer !== undefined) return streamAnswer()
      return mode === 'missing' ? notFound(path) : stream(chat, init?.signal)
    },
  }
}

export type FakeTranscriptServer = ReturnType<typeof fakeTranscriptServer>
