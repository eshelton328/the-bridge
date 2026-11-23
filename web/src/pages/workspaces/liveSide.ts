// A live Claude chat's side questions (backend #456, #460): `POST
// /api/chats/:chat/side` with the contract's `SideQuestionRequest` (the
// question only) answers 202 with the side ID, and `GET
// /api/chats/:chat/side/:side/events` streams the answer: an `open` frame,
// then `side.changed` with the whole answer so far at each change, and it
// ends after the answer's last state. A copy of the chat's saved session
// answers, so the chat never sees the question or the answer.
//
// A question's miss is one line under the side chat's composer, by kind,
// with the lead "Not asked": 409 `chat-not-ready` `noSession` (a chat with no
// saved turn yet) and `sideBusy` (one of the chat's own, or three in all,
// still answer), a 404 (the chat is gone), a 400 (the server's message), and
// any other miss by kind, with Retry for a 5xx, a 429 or no answer. Until the
// server runs side questions (backend PR C) it answers 503 herdr-unavailable.
//
// The stream is read with `lib/eventFrames.ts` from a fetch body. Each event
// holds the whole answer, so the page replaces its copy. The page stops at the
// answer's last state, so it never connects again in a loop. A stream that
// ends or drops before it connects again after `retryMs`, as the server's
// `retry` asks, for as long as the server may still answer (`answerLimitMs`,
// the server's 120 s limit and a margin); a 404 at any time is an answer the
// server no longer has (a restart). report() gets a SideMissError for a 5xx
// and for an answer the page does not expect, with the step, the kind and the
// HTTP status only: never the question, the answer, the chat ID or the
// server's message. The requests put the chat ID in the path URL-encoded
// once.
import {
  ErrorBody,
  type SideAnswer,
  SideChangedEvent,
  type SideId,
  SideQuestionRequest,
  SideStarted,
} from '@bridge/contract'
import { report } from '../../errors/reporter.ts'
import { api } from '../../lib/api.ts'
import { frames } from '../../lib/eventFrames.ts'
import { liveReadTimeoutMs, readJson } from './liveWorkspaces.ts'

/** A side question or its stream that missed, for report(): the step, the kind and the HTTP status, and nothing else. */
class SideMissError extends Error {
  readonly step: 'ask' | 'stream'
  readonly miss: string
  readonly status: number | undefined

  constructor(step: 'ask' | 'stream', kind: string, status: number | undefined) {
    super(`A side question's ${step} missed: ${kind}${status === undefined ? '' : ` (${String(status)})`}`)
    this.name = 'SideMissError'
    this.step = step
    this.miss = kind
    this.status = status
  }
}

/** How long the page waits before it connects to an answer's stream again, in ms: the server's `retry`. */
export const sideRetryMs = 5_000
/** How long after the question the page still connects again to its stream, in ms: the server's 120 s and a margin. */
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

/** Asks `question` about the live chat `chat` (its server ID): the side ID to stream the answer by, or the miss. */
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

/** How an answer's stream ended for good: the answer's last state came, the server no longer has it, or no answer came. */
export type SideEnd = 'last' | 'gone' | 'lost'

export type SideWatch = {
  /** Each answer as it comes, the whole answer each time. */
  readonly onAnswer: (answer: SideAnswer) => void
  /** Once, when the page stops reading for good, except when `stop` stopped it. */
  readonly onEnd: (end: SideEnd) => void
}

/**
 * Follows the answer `side` of the live chat `chat` until its last state; returns the stop. A drop connects again
 * after `sideRetryMs` until `answerLimitMs` from the start, then ends `lost`.
 */
export function watchSide(chat: string, side: SideId, { onAnswer, onEnd }: SideWatch): () => void {
  const stopped = new AbortController()
  const until = Date.now() + answerLimitMs
  const path = `/api/chats/${encodeURIComponent(chat)}/side/${side}/events`
  /** One connection: how it ended, or `drop` when the page may connect again. */
  const connect = async (): Promise<SideEnd | 'drop'> => {
    const connection = new AbortController()
    const signal = AbortSignal.any([stopped.signal, connection.signal])
    let res: Response
    try {
      res = await fetch(path, { headers: { accept: 'text/event-stream' }, signal })
    } catch {
      return 'drop'
    }
    if (res.status === 404) return 'gone'
    if (!res.ok || res.body === null) {
      if (res.status < 500) report(new SideMissError('stream', 'status', res.status), 'live')
      return 'drop'
    }
    const body = res.body
    try {
      return await read(body)
    } catch {
      // A drop, or a stream that gave no byte for too long: connect again.
      return 'drop'
    } finally {
      connection.abort()
    }
  }
  /** Reads one stream's frames until the answer's last state (`last`), or until it ends with none (`drop`). */
  const read = async (body: ReadableStream<Uint8Array>): Promise<SideEnd | 'drop'> => {
    for await (const frame of frames(body)) {
      if (frame.event !== 'side.changed') continue
      const parsed = SideChangedEvent.safeParse(readJson(frame.data))
      if (!parsed.success || parsed.data.data.side !== side) {
        report(new SideMissError('stream', 'bad-reply', undefined), 'live')
        continue
      }
      onAnswer(parsed.data.data)
      if (parsed.data.data.state !== 'answering') return 'last'
    }
    return 'drop'
  }
  void (async () => {
    for (;;) {
      const end = await connect()
      if (stopped.signal.aborted) return
      if (end !== 'drop') {
        onEnd(end)
        return
      }
      if (Date.now() + sideRetryMs > until) {
        report(new SideMissError('stream', 'lost', undefined), 'live')
        onEnd('lost')
        return
      }
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, sideRetryMs)
        stopped.signal.addEventListener(
          'abort',
          () => {
            clearTimeout(timer)
            resolve()
          },
          { once: true },
        )
      })
    }
  })()
  return () => {
    stopped.abort()
  }
}
