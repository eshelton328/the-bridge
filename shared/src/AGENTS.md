# shared/src

One file for each kind of helper, named in camelCase, with its
`*.test.ts` beside it. `index.ts` exports each name.

- `Result<T, E>` with `ok()` and `err()` is for a failure the caller
  expects and handles (d-084). A bug throws an `AppError` with a kind;
  `toAppError()` turns any caught value into one, with no cast
  (d-115, `appError.test.ts`).
- A branded ID is a Zod schema with `.brand()` (d-085). Parse a string
  to get one; never cast.
- A type test uses `expectTypeOf`.
