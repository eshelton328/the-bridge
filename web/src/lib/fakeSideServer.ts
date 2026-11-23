// A fake of the server's side question routes (backend #456, #460), for
// tests: `POST /api/chats/:chat/side` takes the contract's
// `SideQuestionRequest` (a strict object with the question only, trimmed, 1
// to 4000 characters; anything else is 400) and answers 202 with the
// contract's `SideStarted`; `GET /api/chats/:chat/side/:side` gives the answer
// so far, and `.../events` streams it as the server does: an `open` frame,
// then `side.changed` with the whole answer from its state when the stream
// opens and at each change, and it ends after the answer's last state. An
// unknown side, or one of another chat, is 404. Every answer and event is
// checked against the contract (`SideAnswer`, `SideChangedEvent`), so a test
// cannot send what the server would not. A test plugs `handle` into its
// `fetch` stub.
//
// `asks` records each question the page posted, with its chat and body;
// `answerAsks` answers each next one with a test's error (such as 503
// herdr-unavailable, as the served server answers until the runner PR).
// `change` moves an answer on (text, state, cut); `drop` ends its open
// streams with no last state, as a server restart does, and `forget` drops
// the answer, so the next read or stream is 404.
import { ChatId, SideAnswer, SideChangedEvent, SideQuestionRequest, SideStarted } from '@bridge/contract'

type Stream = { readonly side: string; readonly control: ReadableStreamDefaultController<Uint8Array> }

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

const missing = (path: string) =>
  json({ error: { kind: 'not-found', path, message: 'Not found', requestId: 'r-404' } }, 404)

const readBody = (init: RequestInit | undefined): unknown => {
  try {
    return typeof init?.body === 'string' ? JSON.parse(init.body) : undefined
  } catch {
    return undefined
  }
}

export function fakeSideServer(machine = 'test-box') {
  const encoder = new TextEncoder()
  /** Each question the page posted, taken or not: its chat and body. */
  const asks: { chat: string; body: unknown }[] = []
  const answers = new Map<string, SideAnswer>()
  const open: Stream[] = []
  /** The side ID of each stream the page opened, in order. */
  const opens: string[] = []
  let askAnswer: (() => Response) | undefined
  let seq = 0
  let made = 0

  const send = (s: Stream, answer: SideAnswer) => {
    const event = SideChangedEvent.parse({ source: `${machine}/side`, seq, type: 'side.changed', data: answer })
    seq += 1
    s.control.enqueue(
      encoder.encode(`event: side.changed\nid: ${String(event.seq)}\ndata: ${JSON.stringify(event)}\n\n`),
    )
  }
  const close = (s: Stream) => {
    const at = open.indexOf(s)
    if (at !== -1) open.splice(at, 1)
    s.control.close()
  }

  const stream = (side: string, signal: AbortSignal | null | undefined) => {
    let control: ReadableStreamDefaultController<Uint8Array> | undefined
    let ended = false
    const body = new ReadableStream<Uint8Array>({
      start: (c) => {
        control = c
        c.enqueue(encoder.encode('event: open\nretry: 5000\ndata: {}\n\n'))
      },
      cancel: () => {
        ended = true
      },
    })
    if (control !== undefined) {
      const s: Stream = { side, control }
      open.push(s)
      opens.push(side)
      const now = answers.get(side)
      if (now !== undefined) {
        send(s, now)
        if (now.state !== 'answering') {
          ended = true
          close(s)
        }
      }
    }
    signal?.addEventListener('abort', () => {
      const at = open.findIndex((s) => s.control === control)
      if (at !== -1) open.splice(at, 1)
      if (ended) return
      ended = true
      control?.error(new DOMException('The stream was closed.', 'AbortError'))
    })
    return new Response(body, { status: 200, headers: { 'content-type': 'text/event-stream' } })
  }

  /** The answer for `path`, or undefined when the path is not a side route. */
  const handle = (path: string, init?: RequestInit): Response | undefined => {
    const method = init?.method ?? 'GET'
    const ask = /^\/api\/chats\/([^/]+)\/side$/.exec(path)
    if (ask !== null && method === 'POST') {
      const chat = decodeURIComponent(ask[1] ?? '')
      const body = readBody(init)
      asks.push({ chat, body })
      const parsed = SideQuestionRequest.safeParse(body)
      if (!parsed.success)
        return json(
          {
            error: {
              kind: 'invalid-input',
              issues: ['question'],
              message: 'the question is not valid',
              requestId: 'r-400',
            },
          },
          400,
        )
      if (askAnswer !== undefined) return askAnswer()
      made += 1
      const side = made.toString(16).padStart(16, '0')
      answers.set(side, SideAnswer.parse({ side, chat: ChatId.parse(chat), state: 'answering', text: '', cut: false }))
      return json(SideStarted.parse({ side, chat }), 202)
    }
    const read = /^\/api\/chats\/([^/]+)\/side\/([^/]+)(\/events)?$/.exec(path)
    if (read === null || method !== 'GET') return undefined
    const chat = decodeURIComponent(read[1] ?? '')
    const side = read[2] ?? ''
    const answer = answers.get(side)
    if (answer?.chat !== chat) return missing(path)
    return read[3] === undefined ? json(SideAnswer.parse(answer), 200) : stream(side, init?.signal)
  }

  return {
    handle,
    get asks() {
      return asks
    },
    get opens() {
      return opens
    },
    /** The side IDs the fake made, in order. */
    get sides() {
      return [...answers.keys()]
    },
    /** Answers each next question with `answer` until it is set to undefined; the question is still recorded. */
    answerAsks: (answer: (() => Response) | undefined) => {
      askAnswer = answer
    },
    /** Moves the answer `side` on, and sends it on each open stream; a last state ends them. */
    change: (side: string, next: Partial<Pick<SideAnswer, 'state' | 'text' | 'cut'>>) => {
      const now = answers.get(side)
      if (now === undefined) throw new Error(`no side answer ${side}`)
      const answer = SideAnswer.parse({ ...now, ...next })
      answers.set(side, answer)
      for (const s of open.filter((o) => o.side === side)) {
        send(s, answer)
        if (answer.state !== 'answering') close(s)
      }
    },
    /** Ends the open streams of `side` with no last state, as a server restart does. */
    drop: (side: string) => {
      for (const s of open.filter((o) => o.side === side)) close(s)
    },
    /** Drops the answer `side`: its next read or stream is 404. */
    forget: (side: string) => {
      answers.delete(side)
    },
  }
}

export type FakeSideServer = ReturnType<typeof fakeSideServer>
