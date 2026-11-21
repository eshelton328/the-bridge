// Sends each report to the server's log (POST /api/client-errors, d-115),
// as one more sink of the reporter. main.ts adds it only in a build that
// reads the live server (lib/dataSource.ts `readsLiveServer`); a
// production build reads its fixtures and sends nothing.
//
// Privacy: a report carries the error's name, the stack frames with no
// header (which repeats the message) and the route's path, and nothing
// from the page. Only the errors on an allowlist (`ownMessage`: the JS
// built-ins and two app classes) send their own message. The transcript,
// layout, live, send, stop, command and layout write misses send their kind and a ZodError its issue codes
// (`kindOnly`); every other error sends an empty message, so a new error
// class sends no transcript, draft, tool or server text by default.
//
// Sending: one report at a time from a short queue. A 429 stops all
// sending until the server's window (60 reports a minute for each login)
// has passed, and drops what waits; a 400 drops the report with one dev
// warning; a network failure, no answer within 8 s or any other answer
// drops it. The sink never
// calls report() and never throws, so a failed send cannot loop.
import { ClientErrorReport, type ClientErrorSource } from '@bridge/contract'
import { readsLiveServer } from '../lib/dataSource.ts'
import { addSink, type ErrorReport, type ErrorSource, warnInDev } from './reporter.ts'

/** The contract's source for each of the reporter's. */
const sources: Record<ErrorSource, ClientErrorSource> = {
  'root-caught': 'reactRoot',
  'root-uncaught': 'reactRoot',
  'root-recoverable': 'reactRoot',
  window: 'windowError',
  rejection: 'unhandledRejection',
  handler: 'handler',
  shell: 'diagnostic',
  live: 'query',
  query: 'query',
  mutation: 'query',
}

/** The contract's limits (contract/src/clientErrors.ts). */
const limits = { name: 200, message: 2000, stack: 20_000, route: 500, requestId: 200 } as const

/** How long sending stops after a 429: the server's rate-limit window. */
export const pauseAfterLimitMs = 60_000
/** The most reports that wait to be sent; a later one is dropped. */
export const maxWaiting = 20

const stringAt = (value: unknown, key: string): string | undefined => {
  if (typeof value !== 'object' || value === null) return undefined
  const found: unknown = Reflect.get(value, key)
  return typeof found === 'string' ? found : undefined
}

/**
 * The errors that send their own message: the allowlist. Every other error (a plain Error, a SyntaxError, an unknown
 * class) sends its name and an empty message, so a new error class sends no page text until it is checked and added.
 */
const ownMessage: ReadonlySet<string> = new Set([
  // The JS built-ins the engine throws: their message names the code that failed, such as "x is undefined".
  'TypeError',
  'RangeError',
  'ReferenceError',
  'EvalError',
  'URIError',
  // AppShell's diagnostics: the library's English text on how to fix a page mistake (shellDiagnostic.ts).
  'ShellDiagnosticError',
  // A state file that breaks its schema: the state's key and the field, from the app's own sample data (appError.ts).
  'FixtureError',
])

/**
 * The kind an error sends in place of its message, by its name: the transcript and layout misses name a chat and the
 * server's error kind, a live miss holds the server's message, and a ZodError's issues can quote what it read.
 */
const kindOnly: Readonly<Record<string, (error: Error) => string>> = {
  TranscriptMissError: (error) => stringAt(error, 'miss') ?? '',
  LayoutReadMissError: (error) => stringAt(error, 'miss') ?? '',
  // A live chat's Send or Stop that missed (W1): its kind only, never the message text or the chat ID.
  ChatSendMissError: (error) => stringAt(error, 'miss') ?? '',
  // A live chat's file upload that missed (W1b): its kind only, never the file's name or the chat ID.
  ChatUploadMissError: (error) => stringAt(error, 'miss') ?? '',
  // A live chat's focus, zoom, swap or close that missed (W2): its kind only, never the chat ID or its title.
  LayoutWriteMissError: (error) => stringAt(error, 'miss') ?? '',
  LiveMissError: (error) => stringAt(Reflect.get(error, 'miss'), 'kind') ?? '',
  ZodError: (error) => {
    const issues: unknown = Reflect.get(error, 'issues')
    const codes = Array.isArray(issues) ? issues.map((issue: unknown) => stringAt(issue, 'code') ?? '') : []
    return [...new Set(codes)].join(', ')
  },
}

/** What a report says in its message: the kind, the error's own message on the allowlist, else nothing. */
function messageOf(error: Error, name: string): string {
  const kind = Object.hasOwn(kindOnly, name) ? kindOnly[name] : undefined
  if (kind !== undefined) return kind(error)
  return ownMessage.has(name) ? error.message : ''
}

/** A V8 frame ("at f (url:1:2)") or a Firefox or Safari one ("f@url:1:2"). */
const isFrame = (line: string) => /^\s*at\s/.test(line) || /@\S*:\d+:\d+\)?\s*$/.test(line)

/** The stack's frames only: the header, which repeats the name and message, and any other line are dropped. */
function framesOf(error: Error): string | undefined {
  const stack = error.stack
  if (stack === undefined || stack === '') return undefined
  const body = error.message === '' ? stack : stack.split(error.message).join('')
  const frames = body.split('\n').filter(isFrame).join('\n')
  return frames === '' ? undefined : frames.slice(0, limits.stack)
}

/** The X-Request-Id of the failed call the error came from, when it has one. */
const requestIdOf = (error: Error) => stringAt(error, 'requestId') ?? stringAt(Reflect.get(error, 'miss'), 'requestId')

/** A reporter's report as the contract's, checked with its schema; undefined when the schema refuses it. */
export function toClientErrorReport(entry: ErrorReport): ClientErrorReport | undefined {
  const { error } = entry
  const name = (error.name === '' ? 'Error' : error.name).slice(0, limits.name)
  const message = messageOf(error, name).slice(0, limits.message)
  const stack = framesOf(error)
  const requestId = requestIdOf(error)?.slice(0, limits.requestId)
  const parsed = ClientErrorReport.safeParse({
    source: sources[entry.source],
    name,
    message,
    route: (entry.route.split(/[?#]/)[0] ?? '').slice(0, limits.route),
    ...(stack === undefined ? {} : { stack }),
    ...(requestId === undefined ? {} : { requestId }),
  })
  return parsed.success ? parsed.data : undefined
}

/** How long one post may take to answer before it is aborted and dropped, so a stalled server does not hold the queue. */
const postTimeoutMs = 8000

/** Posts one report's JSON and gives the answer's status; rejects when no answer comes or `signal` aborts it. */
export type PostReport = (body: string, signal: AbortSignal) => Promise<number>

const postToServer: PostReport = async (body, signal) => {
  const res = await fetch('/api/client-errors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
    signal,
  })
  return res.status
}

export type SenderDeps = { readonly post?: PostReport; readonly now?: () => number }

/** `post`'s status, or a rejection once `postTimeoutMs` passes with no answer, which also aborts the post. */
function postWithTimeout(post: PostReport, body: string): Promise<number> {
  const abort = new AbortController()
  return new Promise<number>((resolve, reject) => {
    const timer = setTimeout(() => {
      abort.abort()
      reject(new DOMException('The error report got no answer in time.', 'TimeoutError'))
    }, postTimeoutMs)
    const done = () => {
      clearTimeout(timer)
    }
    try {
      post(body, abort.signal).then(resolve, reject).finally(done)
    } catch (thrown) {
      // A post that throws at once is a post with no answer.
      done()
      reject(thrown instanceof Error ? thrown : new Error('the post threw'))
    }
  })
}

/** A reporter sink that sends each report to the server (see the top of this file). */
export function createClientErrorSender({
  post = postToServer,
  now = Date.now,
}: SenderDeps = {}): (entry: ErrorReport) => void {
  const waiting: ClientErrorReport[] = []
  let sending = false
  let pausedUntil = 0
  const paused = () => now() < pausedUntil

  const sendOne = async (next: ClientErrorReport) => {
    let status: number
    try {
      status = await postWithTimeout(post, JSON.stringify(next))
    } catch {
      // No answer, or none in time: the server or the network is down or stalled. Drop it; reporting it would loop.
      return
    }
    if (status === 429) {
      pausedUntil = now() + pauseAfterLimitMs
      waiting.length = 0
    } else if (status === 400) warnInDev('[bridge] the server refused an error report (400); dropped it:', next.name)
  }

  const drain = async () => {
    if (sending) return
    sending = true
    try {
      for (let next = waiting.shift(); next !== undefined && !paused(); next = waiting.shift()) await sendOne(next)
    } finally {
      sending = false
    }
  }

  return (entry) => {
    try {
      if (paused() || waiting.length >= maxWaiting) return
      const body = toClientErrorReport(entry)
      if (body === undefined) return
      waiting.push(body)
      drain().catch(() => undefined)
    } catch (thrown) {
      // Never throw into the reporter, and never report (a loop): log it in development. The report is in the buffer.
      warnInDev('[bridge] the error sender dropped a report:', thrown)
    }
  }
}

/** Adds the sender to the reporter when this build reads the live server; returns its removal. */
export function installClientErrorSender(deps: SenderDeps = {}): () => void {
  if (!readsLiveServer()) return () => undefined
  return addSink(createClientErrorSender(deps))
}
