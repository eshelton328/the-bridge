# the-bridge

The-bridge is the web interface of NCC-1701, the owner's AI harness: one
place to see what needs the owner (the Inbox), the workspaces where agent
chats run, artifacts and the agent toolkit. It is a private React app with
a small server, for the owner and the agents that build it; you need read
access to this repository and to the component library's package.

Status: version 0.0.0, private. The Inbox, Workspaces, Artifacts and
Toolkit pages render each Figma state from typed mock data, in the app, in
Storybook and on the Claude Design canvas. The Workspaces page can also
show live workspaces and chat status from the-bridge server, which reads
herdr (the terminal multiplexer the agent chats run in) on the owner's
machine.

## Prerequisites

- Node 24 or later: `node --version`.
- pnpm 11, through Corepack: `corepack enable`.
- Git, and read access to `eshelton328/the-bridge`.
- The GitHub CLI, logged in (`gh auth login`), with read access to the
  `@eshelton328/component-library-1701` package on GitHub Packages. Give
  pnpm a token for that registry once:

  ```sh
  gh auth refresh -s read:packages
  pnpm config set //npm.pkg.github.com/:_authToken "$(gh auth token)"
  ```

## Quick start

```sh
git clone https://github.com/eshelton328/the-bridge.git ~/the-bridge
cd ~/the-bridge
pnpm install
cd web
pnpm dev
```

`pnpm dev` serves the app on http://localhost:5173 and opens `/` on
the Inbox.

## First use

- Open `/inbox`, `/workspaces`, `/artifacts` or `/toolkit`. With no
  `?state=`, a page shows its home. In development, `?state=<key>` shows
  one Figma state, where `<key>` is a key of the page's
  `web/src/pages/<page>/states/index.ts`.
- `pnpm storybook`, in `web/`, opens Storybook on http://localhost:6007.
  Each page has its screens under `Pages/<Page>/Screens` and one story per
  state under `Pages/<Page>/States`.
- To see live workspaces, start the server as
  [server/AGENTS.md](server/AGENTS.md) says, then open
  `/workspaces?source=live`. The dev server sends `/api` to
  `BRIDGE_SERVER_URL`, or to http://127.0.0.1:5181 when it is not set.

## Help

From the repository root, run the checks, the tests and the builds:

```sh
pnpm exec playwright install chromium
pnpm verify
```

`pnpm verify` stops at the first check that fails, and that check prints
what to fix. The browser tests need the Chromium that the first command
installs. Report a problem at
https://github.com/eshelton328/the-bridge/issues.

## Further reading

- [AGENTS.md](AGENTS.md): the workspace, the checks and the rules; agents
  start here.
- [web/AGENTS.md](web/AGENTS.md): the app, its Storybook and the canvas
  bundle.
- [server/AGENTS.md](server/AGENTS.md): the server and how to run it.
- [scripts/README.md](scripts/README.md): `pnpm new` and the served
  keyboard check.
- [scripts/fidelity/README.md](scripts/fidelity/README.md): the fidelity
  loop, which compares a page state with its Figma frame.
