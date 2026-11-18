# web

`@bridge/web`: the-bridge app (Vite, React 19, TanStack Router), its
Storybook and the canvas bundle. Styles come from the component library
`@eshelton328/component-library-1701` through Panda v2's `designSystem`
(`panda.config.ts`); the app defines no tokens of its own.

- [src/AGENTS.md](src/AGENTS.md): the layers and what each may import.
  Read it before you add a file.
- [public/AGENTS.md](public/AGENTS.md): the web app manifest and the
  home-screen icons. `index.html` links them with the Apple tags
  (`apple-mobile-web-app-*`, `theme-color`), so "Add to Home Screen"
  opens the app standalone.
  Its viewport meta turns page zoom off on every platform
  (`maximum-scale=1, user-scalable=no`), Erik's decision of 2026-11-18:
  iOS zooms the page when a field under 16 px takes the focus, and the
  Figma font sizes stay. WCAG 1.4.4 asks for browser zoom; this is
  Erik's call for his own app. `src/app/viewport.test.ts` checks it.
- `.storybook/`: Storybook 10. Each story is also a Vitest browser test.
- `vite.config.ts`: the app. `vite.canvas.config.ts`: the canvas bundle,
  `dist-canvas/bridge.js`, an IIFE that sets `window.Bridge` and takes
  React and the library from the canvas page (`window.React`,
  `window.CL1701`).
- `styled-system/` is Panda's output; `pnpm codegen` writes it and git
  ignores it.

## The library dependency

The library is `@eshelton328/component-library-1701` from GitHub Packages,
pinned in the catalog of `pnpm-workspace.yaml`. A local install needs a
token with `read:packages` for `//npm.pkg.github.com/` in `~/.npmrc` or
`~/.config/pnpm/auth.ini`; CI uses the workflow's `GITHUB_TOKEN`. After a
version change, delete `node_modules/.vite`, `web/node_modules/.vite` and
`node_modules/.cache/storybook`, or Vite serves the old build.

## Commands

- `pnpm dev`: the app on http://localhost:5173. `/inbox?state=nextStep`
  picks a state in development; `&source=mock-api` or `&source=live`
  picks a data source (`src/lib/dataSource.ts`), which shows "not built
  yet" today. Fixtures is the default.
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
