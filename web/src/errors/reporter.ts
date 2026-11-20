// The one place errors are reported (d-084). React's root hooks and the
// window listeners call report(); boundaries never do. A report goes to a
// ring buffer of the last 50, which the dev ErrorTray shows, and to each
// sink: the console in development, and the server's log when the app
// reads the live server (clientErrorSender.ts).
// Control flow is not an error: the router's redirect and notFound and an
// aborted fetch are never reported.
import { isNotFound, isRedirect } from '@tanstack/react-router'
import { toError } from './appError.ts'

export type ErrorSource =
  | 'root-caught'
  | 'root-uncaught'
  | 'root-recoverable'
  | 'window'
  | 'rejection'
  | 'handler'
  | 'shell'
  | 'live'
  | 'query'
  | 'mutation'

export type ErrorReport = {
  /** The report's place in the order reports came in; unique, so the ErrorTray keys its rows on it. */
  readonly seq: number
  readonly error: Error
  readonly source: ErrorSource
  readonly componentStack: string | undefined
  readonly route: string
  readonly at: string
}

type Sink = (report: ErrorReport) => void

const limit = 50
/** How long an equal report (source, name, message, first stack frame) is dropped after the first, in ms. */
export const repeatWindowMs = 2000

const consoleSink: Sink = (r) => {
  if (import.meta.env.DEV) console.error(`[${r.source}]`, r.error, r.componentStack ?? '')
}

const sinks = new Set<Sink>([consoleSink])
let seen = new WeakSet<object>()
/** When each report's signature was last kept, for the repeat window. */
let recent = new Map<string, number>()
let seq = 0
let reports: readonly ErrorReport[] = []
const listeners = new Set<() => void>()

/** A redirect, a notFound or an aborted request: control flow, which the router or the caller handles. */
function isControlFlow(thrown: unknown): boolean {
  if (isRedirect(thrown) || isNotFound(thrown)) return true
  return typeof thrown === 'object' && thrown !== null && 'name' in thrown && thrown.name === 'AbortError'
}

/** The first frame of a stack: the first line after the "Name: message" header in Chromium, the first line elsewhere. */
function firstFrame(error: Error): string {
  const stack = error.stack ?? ''
  // Chromium starts the stack with the "Name: message" header, which can hold an @ or span lines; drop it.
  const header = String(error)
  const frames = stack.startsWith(header) ? stack.slice(header.length) : stack
  return (
    frames
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.startsWith('at ') || line.includes('@')) ?? ''
  )
}

/** What makes two reports the same error, such as one thrown again on each tick. */
function signature(error: Error, source: ErrorSource): string {
  return JSON.stringify([source, error.name, error.message, firstFrame(error)])
}

/**
 * Reports a thrown value once. The same object reported twice (a boundary
 * and a root hook, say) is kept the first time only, and so is an equal
 * error (same source, name, message and first stack frame) within
 * `repeatWindowMs`, so an error thrown fresh on each tick does not fill the
 * buffer. A redirect, a notFound and an AbortError are not reported. A sink
 * that throws is skipped, so reporting never throws.
 */
export function report(thrown: unknown, source: ErrorSource, componentStack?: string): void {
  if (isControlFlow(thrown)) return
  if (typeof thrown === 'object' && thrown !== null) {
    if (seen.has(thrown)) return
    seen.add(thrown)
    // A wrapper of an error already reported (a caller that adds context to a failed query) is the same failure.
    if ('cause' in thrown && typeof thrown.cause === 'object' && thrown.cause !== null && seen.has(thrown.cause)) return
  }
  const error = toError(thrown)
  const now = Date.now()
  for (const [key, at] of recent) if (now - at >= repeatWindowMs) recent.delete(key)
  const key = signature(error, source)
  if (recent.has(key)) return
  recent.set(key, now)
  seq += 1
  const entry: ErrorReport = {
    seq,
    error,
    source,
    componentStack,
    route: window.location.pathname,
    at: new Date().toISOString(),
  }
  reports = [...reports, entry].slice(-limit)
  for (const listener of listeners) listener()
  for (const sink of sinks) {
    try {
      sink(entry)
    } catch (sinkError) {
      // Not report(): a sink that throws on each report would loop. The report is already in the buffer.
      console.error('[bridge] error sink failed', sinkError)
    }
  }
}

/** Sends each later report to the sink too, after the console; returns the removal. */
export function addSink(sink: Sink): () => void {
  sinks.add(sink)
  return () => {
    sinks.delete(sink)
  }
}

/** Logs a warning in development, such as a report the server refused; a build logs nothing. Never a report. */
export function warnInDev(...parts: unknown[]): void {
  if (import.meta.env.DEV) console.warn(...parts)
}

/** The last reports, oldest first. The array is replaced on each report, so it works with useSyncExternalStore. */
export function getReports(): readonly ErrorReport[] {
  return reports
}

/** Calls the listener after each report; returns the unsubscribe. */
export function subscribeReports(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Empties the buffer and forgets what was seen; for tests and the tray's Clear button. */
export function clearReports(): void {
  reports = []
  seen = new WeakSet<object>()
  recent = new Map<string, number>()
  for (const listener of listeners) listener()
}
