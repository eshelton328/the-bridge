// Errors for bugs: throw them, and a boundary shows the fallback. An
// expected failure is a Result from @bridge/shared instead (d-084).

/** What went wrong, so a fallback or a report can tell bugs apart. */
export type AppErrorKind = 'bug' | 'fixture' | 'unknown'

/** The base error of the app, with a kind and an optional cause. */
export class AppError extends Error {
  readonly kind: AppErrorKind

  constructor(kind: AppErrorKind, message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'AppError'
    this.kind = kind
  }
}

/** A state file that does not match its page schema; the message says which field is wrong. */
export class FixtureError extends AppError {
  readonly fixture: string

  constructor(fixture: string, detail: string) {
    super('fixture', `State "${fixture}" is invalid:\n${detail}`)
    this.name = 'FixtureError'
    this.fixture = fixture
  }
}

/**
 * A window error that the browser masked: a script from another origin
 * threw, so the event has no error object, no file and line 0, and only the
 * text "Script error.". It is not an app bug, but a rise in its count would
 * show an app script that loads from another origin. It sends its kind only:
 * the page's visibility and the time since load (`clientErrorSender.ts`).
 */
export class OpaqueScriptError extends Error {
  readonly miss: string

  constructor(visibility: DocumentVisibilityState, sinceLoadMs: number) {
    super('')
    this.name = 'OpaqueScriptError'
    this.miss = `${visibility}, ${String(Math.round(sinceLoadMs))} ms since load`
  }
}

/** Turns any thrown value into an Error, keeping the value as the cause. */
export function toError(thrown: unknown): Error {
  if (thrown instanceof Error) return thrown
  const message = typeof thrown === 'string' ? thrown : 'A value that is not an Error was thrown'
  return new AppError('unknown', message, { cause: thrown })
}
