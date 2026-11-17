# web

`@bridge/web`: the-bridge app (Vite, React 19, TanStack Router), its
Storybook and the canvas bundle. Styles come from the component library
`@eshelton328/component-library-1701` through Panda v2's `designSystem`
(`panda.config.ts`); the app defines no tokens of its own.

- [src/AGENTS.md](src/AGENTS.md): the layers and what each may import.
  Read it before you add a file.
- `.storybook/`: Storybook 10. Each story is also a Vitest browser test.
- `vite.config.ts`: the app. `vite.canvas.config.ts`: the canvas bundle,
  `dist-canvas/bridge.js`, an IIFE that sets `window.Bridge` and takes
  React and the library from the canvas page (`window.React`,
  `window.CL1701`).
- `styled-system/` is Panda's output; `pnpm codegen` writes it and git
  ignores it.

## The library dependency

> **TODO (library 1.0.0-beta.1):** the library is not published yet, so
> `pnpm-workspace.yaml` overrides it with the sibling clone
> (`file:../../component-library-1701`, a path that holds for a worktree
> in `the-bridge-worktrees/`). Build the clone first (`pnpm build:lib`
> there). After you rebuild it, run `pnpm install --force` and delete
> `node_modules/.vite`, `web/node_modules/.vite` and
> `node_modules/.cache/storybook`, or Vite serves the old build. When `1.0.0-beta.1` is on GitHub Packages, remove the override,
> set the catalog entry to `1.0.0-beta.1` and run `pnpm install`.

## Commands

- `pnpm dev`: the app on http://localhost:5173. `/inbox?state=nextStep`
  picks a state in development.
- `pnpm storybook`: Storybook on http://localhost:6007.
- `pnpm build`, `pnpm build:canvas`.

## Critical rules

The lint enforces each one; the message names the fix.

- A page never imports another page. Routes import a page's `index.ts`.
- Screens and blocks are props-only: no zustand, router, query client,
  error boundary library, `fetch` or storage. The page entry
  (`InboxPage.tsx`) reads the router and stores and passes props.
- Only `state/` imports zustand; every store is made with
  `createAppStore` (d-083). Read a store through its exported hooks.
- Only `errors/` imports react-error-boundary or listens for error
  events, and only `errors/reporter.ts` logs. Render a pane through
  `PaneSlot`.
- No inline `style`; use a library component or `css()` with tokens.
- Folders and non-component files are camelCase; a component file is
  PascalCase and exports a component of the same name (d-088). Route
  files keep TanStack's names.
- Each Figma state is a file in `pages/<page>/states/` with a story
  (d-082); `pnpm check:states` fails without one.
