// The one place errors are reported (d-084). React's root hooks and the
// window listeners call report(); boundaries never do. A report goes to a
// ring buffer of the last 50, which the dev ErrorTray shows, and to each
// sink: the console in development today, a server or Sentry later.
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

export type ErrorReport = {
  readonly error: Error
  readonly source: ErrorSource
  readonly componentStack: string | undefined
  readonly route: string
  readonly at: string
}

type Sink = (report: ErrorReport) => void

const limit = 50

const consoleSink: Sink = (r) => {
  if (import.meta.env.DEV) console.error(`[${r.source}]`, r.error, r.componentStack ?? '')
}

const sinks: readonly Sink[] = [consoleSink]
let seen = new WeakSet<object>()
let reports: readonly ErrorReport[] = []
const listeners = new Set<() => void>()

/**
 * Reports a thrown value once: the same object reported twice (a boundary
 * and a root hook, say) is kept the first time only. A sink that throws is
 * skipped, so reporting never throws.
 */
export function report(thrown: unknown, source: ErrorSource, componentStack?: string): void {
  if (typeof thrown === 'object' && thrown !== null) {
    if (seen.has(thrown)) return
    seen.add(thrown)
  }
  const entry: ErrorReport = {
    error: toError(thrown),
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
    } catch {
      // A sink must never throw; the report is already in the buffer.
    }
  }
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
  for (const listener of listeners) listener()
}
