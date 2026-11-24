// A live Claude chat's side questions (backend #456, #460): `POST
// /api/chats/:chat/side` with the contract's `SideQuestionRequest` (the
// question only) answers 202 with the side ID, and `GET
// /api/chats/:chat/side/:side` gives the whole answer so far. A copy of the
// chat's session (or, for a Code Mode chat, its record) answers, so the
// chat never sees the question or the answer.
//
// A question's miss is one line under the side chat's composer, by kind,
// with the lead "Not asked": 409 `chat-not-ready` `noSession` (a chat with no
// saved turn yet) and `sideBusy` (one of the chat's own, or three in all,
// still answer), a 404 (the chat is gone), a 400 (the server's message), and
// any other miss by kind, with Retry for a 5xx, a 429 or no answer.
//
// The page reads the answer every `sidePollMs` until its last state, and does
// not hold the server's event stream of it (`.../events`): with the page's
// transcript streams and `/api/events`, one more held connection would take
// the browser's last HTTP/1.1 connection to the host, and Stop or a send
// would wait behind it (review of PR #477). Each read has `liveReadTimeoutMs`;
// a read that misses (no answer, a 5xx) is read again, for as long as the
// server may still answer (`answerLimitMs`, the server's 120 s limit and a
// margin), then the answer is `lost`. A 404 is an answer the server no longer
// has (a restart). report() gets a SideMissError for an ask's 5xx, and once
// per answer for a read's error status, an answer the page does not expect
// and a lost answer, with the step, the kind and the HTTP status only: never the question, the answer, the chat ID or the server's message.
// The requests put the chat ID in the path URL-encoded once.
//
// The side composer's Stop posts `POST /api/chats/:chat/side/:side/stop`
// with an empty body (backend #465): 204, also for an answer that already
// ended, and the answer then reads `stopped`. A stop that
// misses is a quiet line with the lead "Not stopped" and no report(): the
// answer still ends on its own or at the server's limit.
import { ErrorBody, SideAnswer, type SideId, SideQuestionRequest, SideStarted, StopChatRequest } from '@bridge/contract'
import { report } from '../../errors/reporter.ts'
import { api } from '../../lib/api.ts'
import { liveReadTimeoutMs, readJson } from './liveWorkspaces.ts'

/** A side question or a read of its answer that missed, for report(): the step, the kind and the HTTP status, and nothing else. */
class SideMissError extends Error {
  readonly step: 'ask' | 'read'
  readonly miss: string
  readonly status: number | undefined

  constructor(step: 'ask' | 'read', kind: string, status: number | undefined) {
    super(`A side question's ${step} missed: ${kind}${status === undefined ? '' : ` (${String(status)})`}`)
    this.name = 'SideMissError'
    this.step = step
    this.miss = kind
    this.status = status
  }
}

/** How often the page reads an answer that still comes, in ms. */
export const sidePollMs = 500
/** How long after the question the page still reads its answer, in ms: the server's 120 s limit and a margin. */
export const answerLimitMs = 150_000

/** What a side question gave: its side ID, or the line to show under the composer, with Retry when `retry`. */
export type SideAsked =
  | { readonly ok: true; readonly side: SideId }
  | { readonly ok: false; readonly line: string; readonly retry: boolean }

const missed = (line: string, retry: boolean): SideAsked => ({ ok: false, line: `Not asked — ${line}`, retry })

/** The line of an error answer to a side question; a fault of the server's goes to report() too. */
function askMiss(status: number, text: string): SideAsked {
  const parsed = ErrorBody.safeParse(readJson(text))
  const error = parsed.success ? parsed.data.error : undefined
  if (error?.kind === 'chat-not-ready' && error.state === 'noSession')
    return missed('the chat has no saved turn yet; send it a message first', false)
  if (error?.kind === 'chat-not-ready' && error.state === 'sideBusy')
    return missed('a side question is still answering', true)
  if (error?.kind === 'not-found') return missed('that chat is gone', false)
  if (error?.kind === 'invalid-input') return missed(error.message, false)
  if (error?.kind === 'too-many-requests') return missed(error.kind, true)
  if (status >= 500) {
    report(new SideMissError('ask', error?.kind ?? 'status', status), 'live')
    return missed(error?.kind ?? `the server answered ${String(status)}`, true)
  }
  report(new SideMissError('ask', error?.kind ?? 'status', status), 'live')
  return missed(error?.kind ?? `the server answered ${String(status)}`, false)
}

/** Asks `question` about the live chat `chat` (its server ID): the side ID to read the answer by, or the miss. */
export async function askSide(chat: string, question: string): Promise<SideAsked> {
  const post = () =>
    api.api.chats[':chat'].side.$post(
      { param: { chat: encodeURIComponent(chat) }, json: SideQuestionRequest.parse({ question }) },
      { init: { signal: AbortSignal.timeout(liveReadTimeoutMs) } },
    )
  let res: Awaited<ReturnType<typeof post>>
  try {
    res = await post()
  } catch {
    // No answer came, or none within the time: the server may have taken it.
    return missed('the server did not answer', true)
  }
  try {
    if (res.status !== 202) return askMiss(res.status, await res.text())
    return { ok: true, side: SideStarted.parse(await res.json()).side }
  } catch {
    // A body that is not JSON, or one the contract refuses.
    report(new SideMissError('ask', 'bad-reply', res.status), 'live')
    return missed('the server answered with something the page does not read', false)
  }
}

/** What a stop gives the side composer: `true` once the server took it, else its quiet line and whether Retry helps. */
export type SideStopped = true | { readonly line: string; readonly retry: boolean }

/** Stops the answer `side` of the live chat `chat`; the answer then reads `stopped`. */
export async function stopSide(chat: string, side: SideId): Promise<SideStopped> {
  const missedStop = (line: string, retry: boolean) => ({ line: `Not stopped — ${line}`, retry })
  let status: number
  try {
    const res = await api.api.chats[':chat'].side[':side'].stop.$post(
      { param: { chat: encodeURIComponent(chat), side }, json: StopChatRequest.parse({}) },
      { init: { signal: AbortSignal.timeout(liveReadTimeoutMs) } },
    )
    status = res.status
  } catch {
    // No answer came, or none within the time.
    return missedStop('the server did not answer', true)
  }
  if (status === 204) return true
  if (status === 404) return missedStop('this answer is gone', false)
  return missedStop(`the server answered ${String(status)}`, status >= 500 || status === 429)
}

/** How the page's reads of an answer ended for good: the answer's last state came, the server no longer has it, or no answer came. */
export type SideEnd = 'last' | 'gone' | 'lost'

export type SideWatch = {
  /** Each answer as it comes, the whole answer each time. */
  readonly onAnswer: (answer: SideAnswer) => void
  /** Once, when the page stops reading for good, except when `stop` stopped it. */
  readonly onEnd: (end: SideEnd) => void
}

/**
 * Follows the answer `side` of the live chat `chat` until its last state; returns the stop. It reads the answer every
 * `sidePollMs`; a read that misses is read again until `answerLimitMs` from the start, then it ends `lost`.
 */
export function watchSide(chat: string, side: SideId, { onAnswer, onEnd }: SideWatch): () => void {
  const stopped = new AbortController()
  const until = Date.now() + answerLimitMs
  const path = `/api/chats/${encodeURIComponent(chat)}/side/${side}`
  let shown: SideAnswer | undefined
  const reported = new Set<string>()
  /** Reports a read's miss once per answer, as the page reads again every `sidePollMs`. */
  const miss = (kind: string, status: number | undefined) => {
    if (reported.has(kind)) return
    reported.add(kind)
    report(new SideMissError('read', kind, status), 'live')
  }
  /** One read: how the answer ended, or `again` when the page reads it again. */
  const readOnce = async (): Promise<SideEnd | 'again'> => {
    let res: Response
    try {
      res = await fetch(path, {
        headers: { accept: 'application/json' },
        signal: AbortSignal.any([stopped.signal, AbortSignal.timeout(liveReadTimeoutMs)]),
      })
    } catch {
      // No answer came, or none within the time: read again.
      return 'again'
    }
    if (res.status === 404) return 'gone'
    if (!res.ok) {
      miss('status', res.status)
      return 'again'
    }
    let answer: SideAnswer
    try {
      const parsed = SideAnswer.safeParse(await res.json())
      if (!parsed.success || parsed.data.side !== side) {
        miss('bad-reply', res.status)
        return 'again'
      }
      answer = parsed.data
    } catch {
      // The body broke off or is not JSON: read again.
      return 'again'
    }
    if (shown?.state !== answer.state || shown.text !== answer.text || shown.cut !== answer.cut) {
      shown = answer
      onAnswer(answer)
    }
    return answer.state === 'answering' ? 'again' : 'last'
  }
  const wait = (ms: number) =>
    new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, ms)
      stopped.signal.addEventListener(
        'abort',
        () => {
          clearTimeout(timer)
          resolve()
        },
        { once: true },
      )
    })
  void (async () => {
    for (;;) {
      const end = await readOnce()
      if (stopped.signal.aborted) return
      if (end !== 'again') {
        onEnd(end)
        return
      }
      if (Date.now() + sidePollMs > until) {
        miss('lost', undefined)
        onEnd('lost')
        return
      }
      // A stop meanwhile aborts the next read, and the loop ends there.
      await wait(sidePollMs)
    }
  })()
  return () => {
    stopped.abort()
  }
}
