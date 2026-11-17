# shared

`@bridge/shared`: code that `web/` and a later server both import. Its
`package.json` exports `src/index.ts` directly; there is no build.

- `src/result.ts`: the `Result<T, E>` union with `ok()` and `err()`, for a
  failure the caller expects and handles (d-084). A bug throws `AppError`
  in web instead.
- `src/ids.ts`: branded ids such as `InboxItemId`, each a Zod schema with
  `.brand()` (d-085). Parse a string to get one; never cast.

## Rules

- No React, no browser or Node globals: the code runs in both places.
- Export each name from `src/index.ts` by name; no `export *`.
- Server types never come through here; a server will export a client
  of its own (d-085).
- Each file has a test beside it; type tests use `expectTypeOf`.
