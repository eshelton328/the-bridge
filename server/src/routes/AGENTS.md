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
  sequence number as the SSE id, and a `: ping` comment line every 15 s
  (`ssePingMs`, `sse.ts`) so a proxy keeps a quiet stream open and the
  page can tell a server that is gone; the transcript stream sends it
  too, and each stream clears its timer when it ends (`sse.test.ts`). A failure in the stream sends one
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
- `GET /api/chats/:chat/skills` (R34) gives the chat's "/" list, built-in
  commands first; none for a Codex chat or a shell; 400 and 404 as the
  transcript read (`chats.test.ts`).
- `GET /api/chats/:chat/transcript/events` answers 400 or 404 as the
  read does, before it streams. Then it streams as `/api/events` does:
  each `transcript.changed` event holds only the entries that are new
  or changed since the stream opened. When the chat leaves the list
  (after `/clear` the pane has a new session, so a new chat ID), it
  sends one `error` event of kind `not-found` and ends; the page then
  follows the chat's pane (`chats.test.ts`).
- `POST /api/chats/:chat/prompt` and `POST /api/chats/:chat/stop` take
  only JSON, and check the body with the contract in a hono `validator`,
  so the typed client knows the body; malformed JSON is 400, not a throw. A sent input is 204; an unknown chat is 404; a shell, a chat
  that waits for the owner, or a stop to a chat that does not work is
  409 `chat-not-ready` with that state; a prompt to a chat whose input box
  holds text is 409 `inputNotEmpty`, one whose box the server cannot
  find on the screen 409 `inputUnreadable`, and a prompt the chat did not take
  is 409 `notSubmitted` (or `inputNotEmpty` when its text stays). `POST /api/chats/:chat/input/clear` takes an
  empty JSON object and empties the box: 204, or 409 `inputNotEmpty`
  when text stays, `noCommands` for a Codex chat. The prompt text goes only to the
  port: never into a log line or an `ErrorBody`, whose issues name the
  field and the rule (`chats.test.ts`). A prompt with the page's
  `sendId` keeps its result for 10 minutes, in memory and with no text
  (`sendResults.ts`): `GET /api/chats/:chat/sends/:send` gives it (404
  when none is kept), and a second prompt with that ID to that chat
  types nothing: 409 `duplicateSend` (`chats.test.ts`).
- `POST /api/chats/:chat/command` (slice W5) takes `{ command:
  'compact', instructions? }` (one line) or `{ command: 'clear' }` as
  JSON and types `/compact` or `/clear` into an idle Claude chat: 204,
  or 409 `working` while the chat works, `noCommands` for a Codex
  chat, and the prompt's answers otherwise. After `/clear` the chat has
  a new chat ID on the same pane. The instructions go only to the port,
  as a prompt's text (`chats.test.ts`).
- `POST /api/chats/:chat/uploads` starts the upload of a file (slice
  W1b): 201 with the upload ID and the chunk size; a shell is 409
  `shell`, a Codex chat 409 `noAttachments`, a file over 1 GiB 413
  `too-large`. `/api/uploads` (`uploads.ts`) takes each chunk with
  `PUT /:upload/chunks/:n` as `application/octet-stream` and streams
  it to the store, then `POST /:upload/complete` and
  `DELETE /:upload`. A wrong chunk or an early complete is 409
  `upload-conflict`, a HEIC photo that does not convert 415
  `unsupported-media`, a full disk 507 `storage-full`. A prompt's
  `attachments` must be complete uploads of its chat (409
  `upload-conflict`; a Codex chat 409 `noAttachments`); the server
  adds the line "Attached files (read each one with your tools):" and
  one path a line below the text. A chunk of 8 MiB passes the Vite proxy
  and Tailscale Serve. The file name and
  bytes never go into a log line or an `ErrorBody` (`uploads.test.ts`).
- `POST /api/chats/:chat/focus`, `/zoom` (`{ zoomed }`), `/swap`
  (`{ with: <chat ID> }`) and `/close` (`{ confirm: <chat ID> }`)
  change the chat's pane in its tab (slice W2): 204, or 404 for an
  unknown chat. A zoom of a tab's only pane is 409 `singlePane`, a swap
  with a chat of another tab 409 `otherTab` and with itself 400. A close
  cannot be undone: its `confirm` must be this chat's ID (400
  otherwise, with no call to the port), and a chat that works or whose
  state herdr cannot tell is 409 `working`, one that waits for the
  owner 409 `needsYou` (`chats.test.ts`). `POST /api/chats/:chat/split`
  (`{ direction }`) puts a new shell pane beside the chat: 201 with its
  chat ID. `POST /api/workspaces/:workspace/layout/ratio` (`{ tab, path,
  ratio }`) sets one split's ratio: 204, or 404 for a tab of another
  workspace or a path with no split. `POST /api/chats/:chat/move` (`{
  tab, direction, beside? }`) puts the chat's pane in another tab of its
  workspace, beside the `beside` chat there: 204, 409 `sameTab` for
  its own tab, 409 `zoomedTab` for a zoomed tab, and 404 for a tab of
  another workspace or a `beside` chat of another tab. The page reads the layout again on
  the `layout.changed` event. `POST /api/chats/:chat/workspace` (`{
  workspace }`) puts the chat's pane in a new tab of another workspace:
  200 with the chat ID and the pane before and after (the same ID, from
  the pane's terminal) and `sourceClosed`, true when the chat was the
  last pane of its workspace, which then closes. 404 is for an unknown
  chat or workspace, 409 `sameWorkspace` for its own workspace, 409
  `working` or `needsYou` for a chat that works, has a state herdr
  cannot tell, or waits for the owner, and 409 `holdsServer` for a
  chat of a workspace that a close refuses as `holdsServer`
  (`chats.test.ts`).
- `POST /api/workspaces/:workspace/rename` and `POST
  /api/chats/:chat/rename` (`{ name }`, R41, R42) rename a workspace or
  a chat: 204, 404 for an unknown one, 400 for a name the contract does
  not take. `POST /api/workspaces/order` (`{ workspaces }`) puts the
  workspaces in that order: 204, 400 for an order that repeats one, or
  409 `workspace-not-ready` `orderStale` for an order that leaves out
  a listed workspace or names another (`workspaceEdits.test.ts`).
  `POST /api/workspaces/:workspace/close` (`{ confirm, panes }`)
  closes a workspace and each chat in it: 204, 400 when `confirm` is
  not this workspace (no call to the port), 404 for an unknown one, or
  409 `workspace-not-ready` with the state `working`, `needsYou`,
  `panesChanged` (another count than `panes`), `holdsServer` or
  `group` (`workspaceEdits.test.ts`).
- `POST /api/chats/:chat/effort` (slice W10) takes `{ effort }` (`low`,
  `medium`, `high` or `xhigh`; `max` is 400) and sets an idle
  Claude chat's effort for its session only: 204, or 409 as a command
  (`working`, `needsYou`, `noCommands`, `inputNotEmpty`,
  `inputUnreadable`), or 409 `effortNotConfirmed` when the screen does
  not show the level after the keys (`chats.test.ts`).
- `POST /api/chats/:chat/model` (slice W10) takes `{ model, confirm }`
  and restarts an idle Claude chat with that model by resume: 200 with
  the chat (the same ID) and its state, or 502 with `failed` and the
  session when the old chat ended and no new one resumed it. A confirm
  of another chat is 400 with no call to the port; 409
  `launchArgsUnknown`, `skipsPermissions`, `folderChanged`,
  `sameModel`, or as an effort change. While a restart of a chat runs,
  each POST to that chat is 409 `restarting`, and a restart while
  another POST to the chat is in progress is 409 `working`
  (`restartGate`, `chats.test.ts`).
- `POST /api/chats` (slice W3) takes a `StartChatRequest` and starts a
  Claude chat beside a chat or in a new tab: 201 with the pane, the chat
  and the state (`ready`, `needsYou` or `starting`), or 200 with the
  first answer for a `createId` that started one. An unknown chat or
  workspace is 404; a folder outside the chat root is 409
  `folderNotAllowed`, a name in use 409 `nameTaken`, and a `createId`
  whose start runs or failed 409 `duplicateCreate` (`chats.test.ts`).
  `POST /api/chats/:chat/fork` forks a Claude chat beside it with these
  answers, as "<name>-fork" by default; a Codex chat or a shell is 409
  `noSession`, and a body with a session or a flag 400 (`chats.test.ts`).
- `/api/push` (d-118): `GET /key` gives the VAPID public key;
  `POST /subscriptions` saves a subscription (400 for an endpoint off
  the known push services; the endpoint is kept as `new URL()` writes
  it, the form the host check read) and `DELETE /subscriptions` removes one;
  `POST /seen` marks a page as visible for 30 s. No endpoint or key goes
  into a log line or an `ErrorBody` (`push.test.ts`).
- `/api/artifacts` (R26, R27): `GET /` lists the library, newest
  first, after a read of what the session files got since the last
  list; `GET /:artifact` gives one artifact and `madeIn`, the chat
  that published it when the workspace list has it now (else null, also
  when herdr does not answer). `POST /` adds an owner link: 201, or
  200 with the library's entry for a link it has. Its body may be as
  large as a link and a title of the most characters at 6 bytes each, so
  a link the contract takes is never too large. `PATCH /:artifact`
  (`{ project }`) files it and `DELETE /:artifact` removes it: 204,
  404 for an ID the library does not have, 400 for an ID that is not 16
  hex characters. `POST /seen` marks the library as seen: 204. A
  store fault is 500 and logs its errno code only; no link or title goes
  into a log line or an `ErrorBody` (`artifacts.test.ts`).
- `/api/inbox` (R20): `GET /` lists the items, newest first, with the
  badge count; `GET /:item` gives one item and its detail.
  `POST /:item/snooze` (`{ until }`), `/done` and `/dismiss` (`{}`)
  mark a chat item: 204, 404 for an unknown ID, 400 for an ID that is
  not 16 hex characters, and 409 `inbox-read-only` for a brain item or
  a chat item with no known turn end. A fault is 500 with its errno code
  in the log only; no title or record text goes into a log line
  (`inbox.test.ts`).
- `sides.ts`, under `/api/chats`: `POST /:chat/side` (`{ question }`)
  asks a side question: 202 with the side ID, 404 for an unknown chat,
  409 `noSession` for a shell, a Codex chat or a chat with no saved
  session, 409 `sideBusy` while one of the chat's own or three in all
  answer, 400 for any other field. `GET /:chat/side/:side` gives the
  answer so far, and `/events` streams `side.changed` with the whole
  answer, from its state when the stream opens, and ends after its
  last state; an unknown side is 404. `POST /:chat/side/:side/stop`
  (`{}`, at most 4 KiB) stops an answer that answers as `stopped`:
  204, also for an answer that ended (the page's Stop and the end can
  cross), 404 for an unknown side. The question and the answer never
  go into a log line or an `ErrorBody` (`chats.test.ts`).
- The JSON checks of each POST route are in `jsonBody.ts`.
- A route takes its services or ports as function arguments; it never
  imports an adapter.
