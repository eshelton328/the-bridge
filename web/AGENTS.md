# web

`@bridge/web`: the-bridge app (Vite, React 19, TanStack Router), its
Storybook and the canvas bundle. Styles come from the component library
`@eshelton328/component-library-1701` through Panda v2's `designSystem`
(`panda.config.ts`); the app defines no tokens of its own.

- `vite.config.ts` builds the app; `vite.canvas.config.ts` builds the
  canvas bundle `dist-canvas/bridge.js`, which takes React and the
  library from the canvas page (`window.React`, `window.CL1701`).
- `styled-system/` is Panda's output from `pnpm codegen`; never edit it.
- `index.html`'s viewport meta turns page zoom off
  (`maximum-scale=1, user-scalable=no`): the owner's decision of
  2026-11-18, so iOS does not zoom into a field under 16 px. It also has
  `viewport-fit=cover`, so AppShell pads by the safe-area insets
  (bridge-shell, brain 681246a). Keep both; `src/app/viewport.test.ts`
  checks it.
- `index.html`'s `color-mode` script applies the saved colour mode
  before the first paint (d-119): it reads only the `bridge/settings`
  key, and a missing or bad value or blocked storage keeps Dark with no
  throw. `app/colorMode.ts` keeps the mode applied after; the page has no
  Content-Security-Policy. `src/app/colorMode.test.ts` runs the script.
- `index.html`'s `text-size` script applies the saved text size the
  same way (d-122): `<html>` starts with `text-default`, Small removes
  it and Large swaps it for `text-large`; a missing or bad value or
  blocked storage keeps Default. `app/textSize.ts` keeps it applied
  after, and `src/app/textSize.test.ts` runs the script.

## The library dependency

The library comes from GitHub Packages, pinned in the catalog of
`pnpm-workspace.yaml`. A local install needs a token with
`read:packages` for `//npm.pkg.github.com/` in `~/.npmrc` or
`~/.config/pnpm/auth.ini`. After a version change, delete
`node_modules/.vite`, `web/node_modules/.vite` and
`node_modules/.cache/storybook`, or Vite serves the old build.

## Commands

Run these in `web/`; the root `package.json` has neither.

- `pnpm dev`: the app on http://localhost:5173. It sends `/api` to the
  server at `BRIDGE_SERVER_URL`, which is required: `vite` and `vite
  preview` stop with an error when it is not set, and there is no
  default. The served app sets `BRIDGE_SERVER_URL=http://127.0.0.1:5181`,
  the server with the owner's real herdr session; a test or a probe sets
  the URL of its own server. Vitest, Storybook and `vite build` start
  without it and get no `/api` proxy (`scripts/viteConfig.test.ts`). In
  development `?state=<key>` picks a page state and `?source=` a data
  source (`src/lib/dataSource.ts`); fixtures are the default, except the
  Workspaces, Artifacts, Inbox and Projects homes, which read live (d-117;
  `?source=fixtures` shows their sample data).
- `pnpm storybook`: Storybook on http://localhost:6007. Each story is
  also a Vitest browser test.

## Folders

- [src/AGENTS.md](src/AGENTS.md): read before you add or move a file in
  the app's source.
- [public/AGENTS.md](public/AGENTS.md): read before you change the web
  app manifest or the home-screen icons.
