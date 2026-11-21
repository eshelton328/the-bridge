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
- `POST /api/client-errors` checks the JSON content type, then the rate
  limit (by the login in lower case), the size and the contract, and only
  then logs; a 429 writes no log line (`clientErrors.test.ts`, d-115).
- `GET /api/workspaces/:workspace/layout` takes the workspace ID
  URL-encoded; an ID with no machine is 400 `invalid-input`, and an
  unknown workspace or one of another machine is 404 `not-found`
  (`app.test.ts`).
- `GET /api/chats/:chat/transcript` takes the chat ID URL-encoded; an
  ID with no machine is 400 `invalid-input` and an unknown chat 404
  `not-found`. Transcript text goes only into the 200 body, never into
  a log line or an `ErrorBody` (`app.test.ts`).
- `GET /api/chats/:chat/transcript/events` answers 400 or 404 as the
  read does, before it streams. Then it streams as `/api/events` does:
  each `transcript.changed` event holds only the entries that are new
  or changed since the stream opened (`chats.test.ts`).
- `POST /api/chats/:chat/prompt` and `POST /api/chats/:chat/stop` take
  only JSON, and check the body with the contract in a hono `validator`,
  so the typed client knows the body; malformed JSON is 400, not a throw. A sent input is 204; an unknown chat is 404; a shell, a chat
  that waits for the owner, or a stop to a chat that does not work is
  409 `chat-not-ready` with that state; a prompt to a chat whose input box
  holds text is 409 `inputNotEmpty`, and a prompt the chat did not take
  is 409 `notSubmitted`. `POST /api/chats/:chat/input/clear` takes an
  empty JSON object and empties the box: 204, or 409 `inputNotEmpty`
  when text stays, `noCommands` for a Codex chat. The prompt text goes only to the
  port: never into a log line or an `ErrorBody`, whose issues name the
  field and the rule (`chats.test.ts`).
- A route takes its services or ports as function arguments; it never
  imports an adapter.
