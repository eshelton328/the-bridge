// Errors that no boundary sees: event handlers, timers, promises and failed
// queries. The window listeners and the query client's error sink send them
// to the reporter. Only this file adds the listeners (the lint bans error
// listeners elsewhere).
import { setQueryErrorSink } from '../lib/queryClient.ts'
import { report } from './reporter.ts'

/** Where the listeners go: the window, or a stand-in in tests. */
export type ErrorEventTarget = Pick<Window, 'addEventListener' | 'removeEventListener'>

/** Adds the window error and unhandledrejection listeners and the query error sink; returns their removal. */
export function installGlobalHandlers(target: ErrorEventTarget = window): () => void {
  const onError = (event: ErrorEvent) => {
    const thrown: unknown = event.error
    report(thrown ?? event.message, 'window')
  }
  const onRejection = (event: PromiseRejectionEvent) => {
    const reason: unknown = event.reason
    report(reason, 'rejection')
  }
  target.addEventListener('error', onError)
  target.addEventListener('unhandledrejection', onRejection)
  const removeSink = setQueryErrorSink((error, source) => {
    report(error, source)
  })
  return () => {
    removeSink()
    target.removeEventListener('error', onError)
    target.removeEventListener('unhandledrejection', onRejection)
  }
}
