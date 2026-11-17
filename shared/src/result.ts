// The result of an operation that can fail in an expected way, such as a
// state file that does not parse. Bugs throw an Error instead; a Result is
// for failures the caller must handle, so the type checker makes it look.
// Narrow on `ok`, and switch on the error's `kind` when it has one.

/** A success that holds its value. */
export type Ok<T> = {
  readonly ok: true
  readonly value: T
}

/** A failure that holds its error. */
export type Err<E> = {
  readonly ok: false
  readonly error: E
}

export type Result<T, E> = Ok<T> | Err<E>

export const ok = <T>(value: T): Ok<T> => ({ ok: true, value })

export const err = <E>(error: E): Err<E> => ({ ok: false, error })
