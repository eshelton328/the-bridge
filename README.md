# the-bridge

The-bridge is the web interface of NCC-1701, Erik's AI harness: one place
to see what needs him (the Inbox), his workspaces, projects, artifacts and
toolkit. It is a private React app, for Erik and the agents that build it.

Status: version 0.0.0, increment 1. The Inbox renders one Figma state
(D1, a next step) from typed mock data in the app, in Storybook and on
the Claude Design canvas. There is no server yet, and the other pages
are not started.

## Prerequisites

- Node 24 or later: `node --version`.
- pnpm 11.24.0, through Corepack: `corepack enable`.
- The component library, built, beside this checkout. Until its
  `1.0.0-beta.1` is on GitHub Packages, the-bridge installs it from
  `../../component-library-1701` relative to this folder, which is where
  it sits for a worktree in `~/ncc-1701/projects/ncc-1701/the-bridge-worktrees/`:

  ```sh
  cd ~/ncc-1701/projects/ncc-1701/component-library-1701
  pnpm install && pnpm build:lib
  ```

## Quick start

From the root of a the-bridge checkout:

```sh
pnpm install
pnpm exec playwright install chromium
pnpm codegen
pnpm dev
```

`pnpm dev` serves the app on http://localhost:5173 and sends `/` to the
Inbox.

## First use

- `pnpm storybook` opens Storybook on http://localhost:6007, with the
  Inbox's D1 story under Pages/Inbox/States and a crash story per error
  boundary.
- `pnpm build:canvas` writes `web/dist-canvas/bridge.js`. On a canvas
  page that has React 18 and the library's bundle, it sets
  `window.Bridge`, and `window.Bridge.mount(element, 'inbox/nextStep', 'D1')`
  renders the Inbox in its D1 state.
- `pnpm new state filterOpen --page inbox --frame D4` adds a Figma state:
  its file, its story and its canvas board.
- `pnpm fidelity inbox D01` compares the Inbox's D1 state with its Figma
  frame. It builds Storybook, renders the state's story in Chromium at the
  frame's size, and checks the text, the boxes of `data-figma` elements
  and the layout rules against `references/inbox/D01/`. It writes a JSON
  report and a Figma-beside-render PNG to `reports/fidelity/inbox/`, and
  exits 1 when a check fails. Leave out the frame id to check every frame
  that has a state file.

## Help

`pnpm verify` runs every check, the tests and the builds; each failing
check prints what to fix. Agents start with [AGENTS.md](AGENTS.md).

## Further reading

- [AGENTS.md](AGENTS.md): the workspace, the checks and the rules.
- [web/AGENTS.md](web/AGENTS.md): the app, the library dependency and the critical rules.
- [web/src/AGENTS.md](web/src/AGENTS.md): the layers and what each may import.
- [scripts/AGENTS.md](scripts/AGENTS.md): the generators, checks and `pnpm new`.
- [scripts/fidelity/AGENTS.md](scripts/fidelity/AGENTS.md): how to run the fidelity loop for one frame.
