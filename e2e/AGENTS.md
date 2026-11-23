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
  pane, a second fake agent with no session (the status chat) beside
  it and an idle shell pane under that, and a second workspace with one
  idle shell (the contract suite moves it into the first), and stops and
  deletes the session after the tests.
- `stack.ts`: starts the server and the web dev server of one test
  file on free ports, with the setup's herdr session.
- `reportAgent.ts`: sets the status chat's status in herdr
  (`pane.report_agent`), as an agent's hook would. herdr ignores such a
  report for a pane with a `herdr:claude` session, whose status it reads
  from the screen.
- `renameTab.ts`: renames the e2e workspace's first tab (`tab.rename`),
  a layout change for the contract suite's `layout.changed` case.
- `appendTranscript.ts`: adds a prompt to the fake chat's session file,
  a transcript change for the contract suite's watch case.
- `fakeAgent.ts`: the fake agent. It writes a Claude Code session file
  (a prompt, a tool call with its result and a reply) where Claude Code
  puts one, prints a fixed script and reports itself
  to herdr as a Claude agent with that session. It records each prompt
  and each Escape that it gets as typed keys, which `receivedBy.ts`
  reads for the contract suite's input cases. It draws an input box as
  Claude Code does: an Escape puts the last prompt back, ctrl+u deletes
  one line, an Enter is lost when `dropEnter.ts` asks, and the status chat reports itself idle after an Escape.
- `paneInput.ts`: types into the status chat's input box or empties it
  (`pane.send_text`, `pane.send_keys`), as the owner would.
- `dropEnter.ts`: makes the status chat lose its next Enter (a file the
  fake agent reads), so the prompt's text stays in its box.
- `herdrAgents.e2e.test.ts`: the `AgentPort` contract suite on the herdr
  adapter and the real session.
- `live.e2e.test.ts`: the live flows: `/workspaces?source=live` lists
  the fake chat with its model and status, and shows a new status when
  herdr changes the status chat's, with no reload (slice 2).
- `stack.e2e.test.ts`: the stack starts with any log level in the
  caller's shell.
- `proxy.e2e.test.ts`: the Vite proxy with Tailscale Serve's headers: a
  tailnet request with no `Tailscale-User-Login` gets the server's 403,
  the owner's login gets 200, and the event stream flows through Vite.
