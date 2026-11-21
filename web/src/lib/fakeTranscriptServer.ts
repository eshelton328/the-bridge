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
// contract refuses, and JSON that does not parse, answer 400
// invalid-input, as the server's routes do (backend #297), and every error
// answer is checked against the contract's `ErrorBody`.
//
// W1-3: a chat whose terminal input holds text (`typeInTerminal`) refuses a
// send with 409 chat-not-ready `inputNotEmpty`, as the server does, until
// the test clears it (`clearTerminal`). A stop never sees this state.
//
// #313: `gone` ends a chat's streams as the server does when the chat leaves
// the list: one `error` event of kind `not-found`, checked against
// `ErrorBody`, then the end.
//
// R28 part B: it takes `POST /api/chats/:chat/input/clear` with `{}`
// (`ClearInputRequest`), which empties the chat's terminal input and answers
// 204, or the test's answer (`answerClears`). A chat the test marks with
// `dropSubmits` refuses each send with 409 chat-not-ready `notSubmitted`, as
// the server does when Claude Code did not take the typed text.
//
// W1b: it has the upload routes of lib/fakeUploadServer.ts (`uploads`), and
// a send may name complete uploads of its chat (`attachments`), with an
// empty text when it has one; one that is not complete, or of another chat,
// answers 409 upload-conflict and sends nothing, as the server does
// (backend #309).
import {
  ClearInputRequest,
  ErrorBody,
  maxTranscriptEntries,
  SendPromptRequest,
  StopChatRequest,
  TranscriptChangedEvent,
  type TranscriptEntry,
  TranscriptResponse,
} from '@bridge/contract'
import { type FakeUploadOptions, fakeUploadServer } from './fakeUploadServer.ts'

type Route = 'prompt' | 'stop' | 'clear'

type Stream = { readonly chat: string; readonly control: ReadableStreamDefaultController<Uint8Array> }

const notFound = (path: string) =>
  new Response(JSON.stringify({ error: { kind: 'not-found', path, message: 'Not found', requestId: 'r-404' } }), {
    status: 404,
    headers: { 'content-type': 'application/json', 'X-Request-Id': 'r-404' },
  })

/** An answer the test picks for a send, a stop or a clear: such as a 503, or one that waits until the test ends it. */
type ActionAnswer = () => Response | Promise<Response>

/** An error answer of a send, a stop or a clear, its body checked against the contract. */
export function errorAnswer(error: ErrorBody['error'], status: number): Response {
  return new Response(JSON.stringify(ErrorBody.parse({ error })), {
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
  /** The upload routes' options, such as a small chunk size. */
  readonly uploads?: FakeUploadOptions
}

export function fakeTranscriptServer({ streams: mode = 'open', uploads: uploadOptions }: FakeTranscriptOptions = {}) {
  const uploads = fakeUploadServer(uploadOptions)
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
  /** Each send the server took, in order: the chat, the text and the files it named. */
  const prompts: { chat: string; text: string; attachments?: readonly string[] }[] = []
  /** The chat of each stop the server took, in order. */
  const stops: string[] = []
  /** The chat of each clear of the terminal input the server took, in order. */
  const clears: string[] = []
  /** Each send, stop or clear the page posted, taken or not: its chat and route. */
  const posts: { chat: string; route: Route }[] = []
  /** The path of each send, stop or clear as the page wrote it, before any decoding. */
  const paths: string[] = []
  let promptAnswer: ActionAnswer | undefined
  let stopAnswer: ActionAnswer | undefined
  let clearAnswer: ActionAnswer | undefined
  /** The chats whose terminal input holds text now. */
  const typed = new Set<string>()
  /** The chats that do not take a typed prompt now: each send answers 409 notSubmitted. */
  const dropping = new Set<string>()

  /** A send, a stop or a clear: the contract's checks, then the test's answer or 204. */
  const act = (chat: string, route: Route, init: RequestInit | undefined) => {
    posts.push({ chat, route })
    const json = new Headers(init?.headers).get('content-type') === 'application/json'
    const body = readBody(init)
    const parsed =
      route === 'prompt'
        ? SendPromptRequest.safeParse(body)
        : route === 'stop'
          ? StopChatRequest.safeParse(body)
          : ClearInputRequest.safeParse(body)
    if (!json || !parsed.success)
      return errorAnswer(
        { kind: 'invalid-input', issues: ['the body'], message: 'Invalid input', requestId: 'r-400' },
        400,
      )
    const answer = route === 'prompt' ? promptAnswer : route === 'stop' ? stopAnswer : clearAnswer
    if (answer !== undefined) return answer()
    if (route === 'clear') {
      typed.delete(chat)
      clears.push(chat)
      return new Response(null, { status: 204 })
    }
    if (route === 'prompt' && typed.has(chat))
      return errorAnswer(
        { kind: 'chat-not-ready', state: 'inputNotEmpty', message: 'Input not empty', requestId: 'r-409' },
        409,
      )
    if (route === 'prompt' && dropping.has(chat))
      return errorAnswer(
        { kind: 'chat-not-ready', state: 'notSubmitted', message: 'Not submitted', requestId: 'r-409' },
        409,
      )
    if (route === 'prompt') {
      const { text, attachments } = SendPromptRequest.parse(body)
      if (attachments !== undefined && !uploads.takeAttachments(chat, attachments))
        return errorAnswer({ kind: 'upload-conflict', message: 'Conflict', requestId: 'r-409' }, 409)
      prompts.push(attachments === undefined ? { chat, text } : { chat, text, attachments })
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
    /** The upload routes (W1b): their records and switches, and the XMLHttpRequest a test stubs for the chunks. */
    uploads,
    reads,
    opens,
    prompts,
    stops,
    clears,
    posts,
    paths,
    /** Answers each send with `answer` until it is set to undefined; the send is not recorded in `prompts`. */
    answerPrompts: (answer: ActionAnswer | undefined) => {
      promptAnswer = answer
    },
    /** Answers each stop with `answer` until it is set to undefined; the stop is not recorded in `stops`. */
    answerStops: (answer: ActionAnswer | undefined) => {
      stopAnswer = answer
    },
    /** Answers each clear with `answer` until it is set to undefined; the clear is not recorded in `clears`. */
    answerClears: (answer: ActionAnswer | undefined) => {
      clearAnswer = answer
    },
    /** `true`: each send to `chat` answers 409 notSubmitted, as when Claude Code did not take it; `false`: sends go through. */
    dropSubmits: (chat: string, drop: boolean) => {
      if (drop) dropping.add(chat)
      else dropping.delete(chat)
    },
    /** Puts text in the terminal input of `chat`, as a stopped prompt does: each send then answers 409 inputNotEmpty. */
    typeInTerminal: (chat: string) => {
      typed.add(chat)
    },
    /** Empties the terminal input of `chat`, as the owner does there: sends go through again. */
    clearTerminal: (chat: string) => {
      typed.delete(chat)
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
    /**
     * Ends each open stream of `chat` as the server does when the chat leaves the list, such as after /clear or when
     * its pane closes (backend #313): one `error` event of kind `not-found`, with the server's message and no transcript
     * text, then the end.
     */
    gone: (chat: string) => {
      const path = `/api/chats/${encodeURIComponent(chat)}/transcript/events`
      const body = ErrorBody.parse({
        error: { kind: 'not-found', message: 'no chat has this ID', path, requestId: 'r-gone' },
      })
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
    /** The answer to a request for `path`, or undefined when it is not a transcript, send, stop or clear route. */
    handle: (path: string, init?: RequestInit): Response | Promise<Response> | undefined => {
      const upload = uploads.handle(path, init)
      if (upload !== undefined) return upload
      const action = /^\/api\/chats\/([^/]+)\/(prompt|stop|input\/clear)$/.exec(path)
      if (action !== null && init?.method === 'POST') {
        paths.push(path)
        const route: Route = action[2] === 'stop' ? 'stop' : action[2] === 'prompt' ? 'prompt' : 'clear'
        return act(decodeURIComponent(action[1] ?? ''), route, init)
      }
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
