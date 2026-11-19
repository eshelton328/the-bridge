# server

`@bridge/server`: the-bridge server, Hono on Node 24 (d-033, d-111). It
is one more client of the herdr socket API (d-110) and pushes changes;
it polls nothing (d-112). The routes: `GET /api/workspaces`, the
workspaces and their chats (slice 1), and `GET /api/events`, the live
events as server-sent events (slice 2).

- `src/routes/`: thin Hono sub-apps, one for each area. A route checks
  its output with `@bridge/contract` and calls a service.
- `src/services/`: what the app does, in its own terms. `agentPort.ts`
  is the `AgentPort` interface: the only way the server reaches agents.
  `liveEvents.ts` holds one port subscription for all clients of
  `/api/events`: the first client opens it, the last one to go closes
  it, and when the port stops answering it ends each client's stream.
- `src/adapters/`: one real adapter and one fake for each port.
  `herdrAgents.ts` reads `workspace.list` and `agent.list` from the
  herdr socket (`herdrSocket.ts`) and the model from each Claude chat's
  session file (`sessionFile.ts`), only when a request comes. Its
  `subscribe` holds one herdr `events.subscribe` stream: the status of
  each chat's pane and the list events; when a pane or workspace comes or
  goes, it opens the stream again for the new panes and tells the app to
  read the list again.
  `fakeAgents.ts` holds fixed data. `agentPortContract.ts` is the one
  contract test suite; `fakeAgents.test.ts` and `herdrAgents.test.ts` run
  it, and `e2e/` runs it on a real herdr session.
- `src/routes/events.ts`: the SSE stream. It sends an `open` frame with
  the retry time (5 s), then each event with its type as the SSE event
  name and its sequence number as the SSE id, and a comment line every
  25 s so a proxy keeps a quiet stream open.
- `src/app.ts`: the app (auth, then each sub-app) and `AppType`.
- `src/client.ts`: the typed Hono RPC client. `pnpm codegen` compiles
  its type once to `dist/client.d.ts`; web imports `@bridge/server/client`.
- `src/auth.ts`: who may call the API, as the omni server decides: a
  request through Tailscale Serve must carry the owner's
  `Tailscale-User-Login`; a request with no identity is let in only when
  it comes to localhost with no proxy header.
- `src/config.ts`: every path and port comes from an environment
  variable; the server does not start when one is missing.

## Run

```bash
BRIDGE_PORT=5181 BRIDGE_MACHINE_ID=mac-mini BRIDGE_OWNER_LOGIN=<login> \
BRIDGE_HERDR_SOCKET=$HOME/.config/herdr/herdr.sock BRIDGE_BRAIN_DIR=$HOME/ncc-1701/engine \
BRIDGE_DB_FILE=$HOME/.local/share/the-bridge/bridge.db BRIDGE_CLAUDE_PROJECTS=$HOME/.claude/projects \
pnpm --filter @bridge/server start
```

Then `pnpm dev` and open `/workspaces?source=live`; Vite sends `/api` to
`BRIDGE_SERVER_URL` (`http://127.0.0.1:5181` when not set).

## Rules

- No herdr pane ID, key press or terminal text leaves `src/adapters/`.
- No polling: an adapter reads only when a request or a subscription asks.
  With no client of `/api/events` open, no herdr stream is open.
- Each port has a fake, and the contract suite runs on both adapters.
- API tests call `app.request()` with the fake adapter (d-113).
