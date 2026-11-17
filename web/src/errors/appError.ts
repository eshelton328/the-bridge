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

/** Turns any thrown value into an Error, keeping the value as the cause. */
export function toError(thrown: unknown): Error {
  if (thrown instanceof Error) return thrown
  const message = typeof thrown === 'string' ? thrown : 'A value that is not an Error was thrown'
  return new AppError('unknown', message, { cause: thrown })
}
