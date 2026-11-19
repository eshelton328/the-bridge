# web/src

The app's source, organised by page (d-081, d-088). `structure.ts` lists
the layers and what each may import; the lint (`eslint.config.js`),
`scripts/checkStructure.ts` and `scripts/new.ts` read it.

## Rules

- Imports go down the layers, never across pages; a page is imported only
  through its `index.ts`. No import cycle (`pnpm check:cycles`).
- Screens, page blocks, states and `blocks/` are props-only: no zustand,
  router, query client, error boundary library, `fetch` or storage. The
  page entry reads the router and stores and passes props.
- No inline `style`; use a library component or `css()` with tokens.
- Folders and non-component files are camelCase; a component file is
  PascalCase and exports a component of the same name (d-088). Route
  files keep TanStack's names.
- Name each export; no default export except where a tool needs one
  (stories, configs), and no `export *` (d-081).
- One component per file, about 150 lines at most (d-081).
- Each Figma state is a file in `pages/<page>/states/` with a story
  (d-082); `pnpm check:states` fails without one.

## Folders

- [app/AGENTS.md](app/AGENTS.md): read before you change the app's start,
  the router or a test that runs the real route tree.
- [routes/AGENTS.md](routes/AGENTS.md): read before you add or rename a
  route.
- [pages/AGENTS.md](pages/AGENTS.md): read before you work on a page.
- [blocks/AGENTS.md](blocks/AGENTS.md): read before you add or move a
  block that two pages use.
- [state/AGENTS.md](state/AGENTS.md): read before you add or read a store.
- [errors/AGENTS.md](errors/AGENTS.md): read before you touch an error
  path, a boundary or logging.
- [lib/AGENTS.md](lib/AGENTS.md): read before you add a helper or write a
  browser test that waits on focus or layout.
- [design/AGENTS.md](design/AGENTS.md): read before you change the canvas
  bundle.
