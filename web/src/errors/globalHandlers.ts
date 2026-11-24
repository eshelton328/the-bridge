// Errors that no boundary sees: event handlers, timers, promises, failed
// queries and Web Push misses (d-118). The window listeners and the query
// client's and the push switch's error sinks send them to the reporter. Only this file adds the listeners (the lint bans error
// listeners elsewhere).
import { setPushMissSink } from '../lib/pushSwitch.ts'
import { setQueryErrorSink } from '../lib/queryClient.ts'
import { OpaqueScriptError } from './appError.ts'
import { report } from './reporter.ts'

/** Where the listeners go: the window, or a stand-in in tests. */
export type ErrorEventTarget = Pick<Window, 'addEventListener' | 'removeEventListener'>

/**
 * The masked event of an error in a script from another origin: the text
 * "Script error.", no error object, no file and line 0. Other events have no
 * error object and no file too, such as a ResizeObserver loop error, so the
 * text is part of the test.
 */
function isOpaqueScriptError(event: ErrorEvent): boolean {
  return (
    event.message === 'Script error.' &&
    (event.error === null || event.error === undefined) &&
    event.filename === '' &&
    event.lineno === 0
  )
}

/** Adds the window error and unhandledrejection listeners and the query and push error sinks; returns their removal. */
export function installGlobalHandlers(target: ErrorEventTarget = window): () => void {
  const onError = (event: ErrorEvent) => {
    if (isOpaqueScriptError(event)) {
      report(new OpaqueScriptError(document.visibilityState, performance.now()), 'window')
      return
    }
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
  const removePushSink = setPushMissSink((error) => {
    report(error, 'handler')
  })
  return () => {
    removeSink()
    removePushSink()
    target.removeEventListener('error', onError)
    target.removeEventListener('unhandledrejection', onRejection)
  }
}
