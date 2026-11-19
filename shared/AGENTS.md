# shared

`@bridge/shared`: code that `web/` and `server/` both import. Its
`package.json` exports `src/index.ts` directly; there is no build.

## Rules

- No React, no browser or Node globals: the code runs in both places.
- Export each name from `src/index.ts` by name; no `export *`.
- Server types never come through here; web takes them from the server's
  own client, `@bridge/server/client` (d-085).
- A schema of the API between the server and its clients goes in
  [../contract/](../contract/AGENTS.md), not here (d-111).

## Folders

- [src/AGENTS.md](src/AGENTS.md): read before you add or change a helper
  or a branded ID.
