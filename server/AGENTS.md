# server

`@bridge/server`: the-bridge server, Hono on Node 24 (d-033, d-111). It
is one more client of the herdr socket API (d-110) and pushes changes to
its clients; it polls nothing (d-112). Its routes are the areas under
`/api/` that `src/app.ts` mounts.

## Run

```bash
BRIDGE_PORT=5181 BRIDGE_MACHINE_ID=mac-mini BRIDGE_OWNER_LOGIN=<login> \
BRIDGE_HERDR_SOCKET=$HOME/.config/herdr/herdr.sock BRIDGE_BRAIN_DIR=$HOME/ncc-1701/engine \
BRIDGE_DB_FILE=$HOME/.local/share/the-bridge/bridge.db BRIDGE_CLAUDE_PROJECTS=$HOME/.claude/projects \
pnpm --filter @bridge/server start
```

Then `pnpm dev` in `web/` and open `/workspaces?source=live`; Vite sends
`/api` to `BRIDGE_SERVER_URL` (`http://127.0.0.1:5181` when not set).

## Rules

- No herdr pane ID, key press or terminal text leaves `src/adapters/`.
- No polling: an adapter reads only when a request or a subscription
  asks. With no client of `/api/events` open, no herdr stream is open.
- Each port has a fake, and the port's contract suite runs on both
  adapters and in `e2e/` on a real herdr.

## Folders

- [src/AGENTS.md](src/AGENTS.md): read before you change the server's
  code or its tests.
