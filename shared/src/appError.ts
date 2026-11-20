// An error that a bug or an unexpected value throws, with a kind that says
// what went wrong (d-115). An expected failure is a Result instead.

export class AppError<const Kind extends string = string> extends Error {
  readonly kind: Kind

  constructor(kind: Kind, message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'AppError'
    this.kind = kind
  }
}

/**
 * Any caught value as an `AppError` of one of the caller's kinds: an `AppError` whose kind `isKind` accepts
 * keeps its kind, and anything else becomes `fallback` with the value as its cause.
 */
export function toAppError<const Kind extends string>(
  thrown: unknown,
  isKind: (kind: string) => kind is Kind,
  fallback: Kind,
): AppError<Kind> {
  if (thrown instanceof AppError) {
    // instanceof gives AppError<any>, so the kind is read as unknown and checked.
    const kind: unknown = thrown.kind
    if (typeof kind === 'string' && isKind(kind)) return new AppError(kind, thrown.message, { cause: thrown })
  }
  const message =
    thrown instanceof Error ? thrown.message : typeof thrown === 'string' ? thrown : 'a value that is not an Error'
  return new AppError(fallback, message, { cause: thrown })
}
