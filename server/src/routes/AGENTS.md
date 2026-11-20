# routes

Thin Hono sub-apps, one file for each area, named after the area
(`<area>.ts`) and mounted under `/api/<area>` in `../app.ts`.

- A route reads the request, calls a service and returns its result. The
  logic goes in [../services/](../services/AGENTS.md).
- A route checks its output with the schema from `@bridge/contract`
  before it sends it (d-111). A new response or event gets its schema
  there first.
- No herdr terms here: a route never sees a pane ID, a key press or
  terminal text (d-110).
- The SSE stream of `/api/events` sends an `open` frame with the retry
  time, then each event with its type as the SSE event name and its
  sequence number as the SSE id, and a comment line every 25 s so a
  proxy keeps a quiet stream open. A failure in the stream sends one
  `error` event with an `ErrorBody`, never the raw message, and ends it
  (`events.test.ts`, d-115).
- A route takes its services or ports as function arguments; it never
  imports an adapter.
