# shared/src

One file for each kind of helper, named in camelCase, with its
`*.test.ts` beside it. `index.ts` exports each name.

- `Result<T, E>` with `ok()` and `err()` is for a failure the caller
  expects and handles (d-084). A bug throws instead (`AppError` in web).
- A branded ID is a Zod schema with `.brand()` (d-085). Parse a string
  to get one; never cast.
- A type test uses `expectTypeOf`.
