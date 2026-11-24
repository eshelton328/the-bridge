// A fake of the server's side question routes (backend #456, #460), for
// tests: `POST /api/chats/:chat/side` takes the contract's
// `SideQuestionRequest` (a strict object with the question only, trimmed, 1
// to 4000 characters; anything else is 400) and answers 202 with the
// contract's `SideStarted`; `GET /api/chats/:chat/side/:side` gives the answer
// so far. The server has no stream of an answer, so `.../events` is 404, as
// there; `opens` records each such request, so a test can show the page makes
// none. An unknown side, or one of another chat, is 404. Every answer is
// checked against the contract (`SideAnswer`), so a test cannot send what the
// server would not. A test plugs `handle` into its `fetch` stub.
//
// `asks` records each question the page posted, with its chat and body;
// `answerAsks` answers each next one with a test's error (such as 503
// herdr-unavailable, as the served server answers until the runner PR).
// `change` moves an answer on (text, state, cut), and `forget` drops the
// answer, so the next read is 404.
//
// `POST /api/chats/:chat/side/:side/stop` (backend #465) takes the
// contract's `StopChatRequest` (an empty object; anything else is 400) and
// answers 204, also for an answer that already ended: one that still answers
// becomes `stopped`, with its text so far. An unknown
// side, or one of another chat, is 404. `stops` records each side the page
// stopped; `answerStops` answers each next stop with a test's error.
// `reads` records the side ID of each read of an answer (`GET
// .../side/:side`), and `answerReads` answers each next read with a test's
// error.
import { ChatId, SideAnswer, SideQuestionRequest, SideStarted, StopChatRequest } from '@bridge/contract'

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

export function fakeSideServer() {
  /** Each question the page posted, taken or not: its chat and body. */
  const asks: { chat: string; body: unknown }[] = []
  const answers = new Map<string, SideAnswer>()
  /** The side ID of each stream the page asked for (`.../events`, 404), in order. */
  const opens: string[] = []
  let askAnswer: (() => Response) | undefined
  /** The side ID of each read of an answer the page made, answered or not. */
  const reads: string[] = []
  let readAnswer: (() => Response) | undefined
  /** The side ID of each stop the page posted, taken or not. */
  const stops: string[] = []
  let stopAnswer: (() => Response) | undefined
  let made = 0

  /** Moves the answer `side` on. */
  const change = (side: string, next: Partial<Pick<SideAnswer, 'state' | 'text' | 'cut'>>) => {
    const now = answers.get(side)
    if (now === undefined) throw new Error(`no side answer ${side}`)
    answers.set(side, SideAnswer.parse({ ...now, ...next }))
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
    const stop = /^\/api\/chats\/([^/]+)\/side\/([^/]+)\/stop$/.exec(path)
    if (stop !== null && method === 'POST') {
      const chat = decodeURIComponent(stop[1] ?? '')
      const side = stop[2] ?? ''
      stops.push(side)
      if (!StopChatRequest.safeParse(readBody(init)).success)
        return json(
          { error: { kind: 'invalid-input', issues: [], message: 'the body is not valid', requestId: 'r-400' } },
          400,
        )
      if (stopAnswer !== undefined) return stopAnswer()
      const answer = answers.get(side)
      if (answer?.chat !== chat) return missing(path)
      if (answer.state === 'answering') change(side, { state: 'stopped' })
      return new Response(null, { status: 204 })
    }
    const read = /^\/api\/chats\/([^/]+)\/side\/([^/]+)(\/events)?$/.exec(path)
    if (read === null || method !== 'GET') return undefined
    const chat = decodeURIComponent(read[1] ?? '')
    const side = read[2] ?? ''
    if (read[3] !== undefined) {
      opens.push(side)
      return missing(path)
    }
    reads.push(side)
    if (readAnswer !== undefined) return readAnswer()
    const answer = answers.get(side)
    if (answer?.chat !== chat) return missing(path)
    return json(SideAnswer.parse(answer), 200)
  }

  return {
    handle,
    get asks() {
      return asks
    },
    get reads() {
      return reads
    },
    /** Answers each next read of an answer with `answer` until it is set to undefined; the read is still recorded. */
    answerReads: (answer: (() => Response) | undefined) => {
      readAnswer = answer
    },
    get stops() {
      return stops
    },
    /** Answers each next stop with `answer` until it is set to undefined; the stop is still recorded. */
    answerStops: (answer: (() => Response) | undefined) => {
      stopAnswer = answer
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
    change,
    /** Drops the answer `side`: its next read is 404. */
    forget: (side: string) => {
      answers.delete(side)
    },
  }
}

export type FakeSideServer = ReturnType<typeof fakeSideServer>
