# e2e

The small local E2E suite of the-bridge backend (d-113). It runs real
herdr in a separate session (`bridge-e2e-<pid>`, never the owner's own), the
fake agent, the server and the web dev server, with Playwright's
Chromium. It uses no tokens.

```bash
pnpm test:e2e
```

It needs `herdr` on the PATH, so it runs on a Mac before a backend PR,
not in CI or `pnpm verify`.

- `herdrSession.ts`: the global setup. It starts the herdr session,
  makes a workspace in a temporary folder, runs the fake agent in its
  pane, and stops and deletes the session after the tests.
- `fakeAgent.ts`: the fake agent. It writes a Claude Code session file
  where Claude Code puts one, prints a fixed script and reports itself
  to herdr as a Claude agent with that session.
- `herdrAgents.e2e.test.ts`: the `AgentPort` contract suite on the herdr
  adapter and the real session.
- `live.e2e.test.ts`: the first flow: `/workspaces?source=live` lists
  the fake chat with its model and status.
