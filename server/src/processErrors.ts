// What the server does with an error that nothing caught (d-115): it
// logs it at fatal and exits with code 1, so launchd starts it again. With
// an uncaughtException handler, Node otherwise exits with code 0.
import type { Logger } from './logger.ts'

type ProcessEvents = {
  on(event: 'uncaughtException', listener: (error: Error) => void): unknown
  on(event: 'unhandledRejection', listener: (reason: unknown) => void): unknown
  exitCode?: number | string | null | undefined
  exit(code: number): never
}

export function handleProcessErrors(proc: ProcessEvents, log: Logger): void {
  proc.on('uncaughtException', (err) => {
    log.fatal('uncaught exception', { err })
    proc.exitCode = 1
    proc.exit(1)
  })
  proc.on('unhandledRejection', (reason) => {
    log.fatal('unhandled rejection', { err: reason })
    proc.exitCode = 1
    proc.exit(1)
  })
}
