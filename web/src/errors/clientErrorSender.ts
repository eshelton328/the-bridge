// Sends each report to the server's log (POST /api/client-errors, d-115),
// as one more sink of the reporter. main.ts adds it only in a build that
// reads the live server (lib/dataSource.ts `readsLiveServer`); a
// production build reads its fixtures and sends nothing.
//
// Privacy: a report carries the error's name, its own message, the stack
// frames and the route's path, and nothing from the page. An error whose
// message can hold transcript text, a tool target, a draft or the
// server's text (`kindOnly`) sends its name and its kind only, and no
// stack header, which repeats the message.
//
// Sending: one report at a time from a short queue. A 429 stops all
// sending until the server's window (60 reports a minute for each login)
// has passed, and drops what waits; a 400 drops the report with one dev
// warning; a network failure or any other answer drops it. The sink never
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
 * The kind of an error whose message can hold page or server text, by its name: the transcript and layout misses
 * name a chat and the server's error kind, a live miss holds the server's message, a ZodError's issues can quote
 * what it read, and a SyntaxError from JSON.parse quotes the start of the text. Undefined for any other error.
 */
const kindOnly: Readonly<Record<string, (error: Error) => string>> = {
  TranscriptMissError: (error) => stringAt(error, 'miss') ?? '',
  LayoutReadMissError: (error) => stringAt(error, 'miss') ?? '',
  LiveMissError: (error) => stringAt(Reflect.get(error, 'miss'), 'kind') ?? '',
  ZodError: (error) => {
    const issues: unknown = Reflect.get(error, 'issues')
    const codes = Array.isArray(issues) ? issues.map((issue: unknown) => stringAt(issue, 'code') ?? '') : []
    return [...new Set(codes)].join(', ')
  },
  SyntaxError: () => '',
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
  const kind = Object.hasOwn(kindOnly, name) ? kindOnly[name] : undefined
  const message = (kind === undefined ? error.message : kind(error)).slice(0, limits.message)
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

/** Posts one report's JSON and gives the answer's status; rejects when no answer comes. */
export type PostReport = (body: string) => Promise<number>

const postToServer: PostReport = async (body) => {
  const res = await fetch('/api/client-errors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  })
  return res.status
}

export type SenderDeps = { readonly post?: PostReport; readonly now?: () => number }

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
      status = await post(JSON.stringify(next))
    } catch {
      // No answer: the server or the network is down. Drop it; reporting it would loop.
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
    } catch {
      // Never throw into the reporter, and never report: the report is already in its buffer.
    }
  }
}

/** Adds the sender to the reporter when this build reads the live server; returns its removal. */
export function installClientErrorSender(deps: SenderDeps = {}): () => void {
  if (!readsLiveServer()) return () => undefined
  return addSink(createClientErrorSender(deps))
}
