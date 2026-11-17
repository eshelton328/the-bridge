// Errors that no boundary sees: event handlers, timers and promises. The
// window listeners send them to the reporter. Only this file adds them
// (the lint bans error listeners elsewhere).
import { report } from './reporter.ts'

/** Where the listeners go: the window, or a stand-in in tests. */
export type ErrorEventTarget = Pick<Window, 'addEventListener' | 'removeEventListener'>

/** Adds the window error and unhandledrejection listeners; returns their removal. */
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
  return () => {
    target.removeEventListener('error', onError)
    target.removeEventListener('unhandledrejection', onRejection)
  }
}
