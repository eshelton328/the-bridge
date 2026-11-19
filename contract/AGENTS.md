# contract

`@bridge/contract`: the Zod schemas of every request, response and
server-sent event between the-bridge server and its clients (d-111). The
server's routes check their output with them, and the web client parses
each response with them. Its `package.json` exports `src/index.ts`
directly; there is no build.

- `src/ids.ts`: `MachineId`, `WorkspaceId` and `ChatId`. A workspace or
  chat ID holds its machine ID before a `/`, such as `mac-mini/w17`, so
  IDs stay unique when a second machine comes.
- `src/workspaces.ts`: the workspace summary and the chat summary (kind,
  title, model, the share of context used, status, parent chat) and the
  response of `GET /api/workspaces`.
- `src/events.ts`: the event envelope: its source, its sequence number,
  its type and its data. Each source has its own sequence numbers.
- `src/liveEvents.ts`: the events of `GET /api/events` (SSE):
  `chat.status` (a chat's new status) and `workspaces.changed` (read
  the workspaces again). A client reads the workspaces again each time
  the stream opens.

## Rules

- No React, no browser or Node globals: web, the server, hooks and
  scripts all import this package.
- No local path in a schema. A path stays inside the server's adapters.
- The terms are the app's, not herdr's: no pane ID, key press or terminal
  text (d-110).
- Export each name from `src/index.ts` by name; no `export *`.
- Each file has a test beside it.
- After slice 1 merges, the `backend-coord` chat owns this package
  (d-114); tell it before you change a schema.
