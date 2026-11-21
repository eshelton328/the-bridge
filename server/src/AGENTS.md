# server/src

The server's source in three layers: `routes/` call `services/`, and
`services/` reach the outside world only through ports that
`adapters/` fill (d-110). The files at this level wire them together.

- `app.ts` builds the app: the request ID and the request log, then the
  auth check, then one sub-app for each area, and exports `AppType`. A new route is mounted here.
- `main.ts` is the only file that reads `process.env` (through
  `config.ts`) and the only one that picks the real adapters;
  `logsCli.ts`, the `pnpm logs` command, reads only `BRIDGE_LOG_DIR`.
- `logger.ts`: the one logger (d-115). A message is a constant
  `LogMessage` and the data goes in fields; redaction reads only fields
  (`logger.test.ts`). No `console` in the server.
- `errors.ts`: every non-2xx response comes from `errorJson()`, an
  `ErrorBody` with the request ID; a port error maps to 503 or 502 in a
  checked switch, and the detail goes to the log only
  (`app.test.ts`, d-115).
- `rateLimit.ts`: a fixed window in memory for each key; the error
  report route takes 60 a minute (`rateLimit.test.ts`).
- `processErrors.ts`: an uncaught error logs at fatal and exits with
  code 1 (`processErrors.test.ts`).
- `config.ts`: every path and port comes from an environment variable,
  and the server does not start when one is missing. `BRIDGE_CHAT_ROOT`
  (else the brain folder's parent) is the only folder tree in which the
  app may start a chat (slice W3).
- `auth.ts`: a request through Tailscale Serve must carry the owner's
  `Tailscale-User-Login`; a request with no identity is let in only on
  localhost with no proxy header.
- `client.ts` is the typed Hono RPC client that web imports as
  `@bridge/server/client`. Run `pnpm codegen` after a route change, so
  `dist/client.d.ts` has the new type.
- A module with logic has a `*.test.ts` beside it; a thin route is
  tested through the API tests. An API test calls
  `app.request()` with the fake adapter (d-113); a test that needs a real
  herdr goes in [../../e2e/](../../e2e/AGENTS.md), never here.

## Folders

- [routes/AGENTS.md](routes/AGENTS.md): read before you add or change an
  HTTP route or the SSE stream.
- [services/AGENTS.md](services/AGENTS.md): read before you change what
  the server does or a port's interface.
- [adapters/AGENTS.md](adapters/AGENTS.md): read before you change how
  the server talks to herdr or the files on disk, or a fake.
