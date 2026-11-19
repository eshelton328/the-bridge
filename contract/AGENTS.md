# contract

`@bridge/contract`: the Zod schemas of every request, response and
server-sent event between the-bridge server and its clients (d-111). The
server's routes check their output with them, and the web client parses
each response with them. Its `package.json` exports `src/index.ts`
directly; there is no build.

## Rules

- The backend-coord chat owns this package (d-114); tell it before you
  change a schema.
- No React, no browser or Node globals: web, the server, hooks and
  scripts all import this package.
- No local path in a schema. A path stays inside the server's adapters.
- The terms are the app's, not herdr's: no pane ID, key press or terminal
  text (d-110).
- Export each name from `src/index.ts` by name; no `export *`.

## Folders

- [src/AGENTS.md](src/AGENTS.md): read before you add or change a schema.
