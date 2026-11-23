# blocks

Blocks that two or more pages use (d-088, d-089): composites of library
parts. A block starts in its page's `blocks/` and moves here when a
second page needs it.

## Rules

- Props-only: data in as props, changes out through callbacks. No
  store, router, `fetch` or storage; the lint rejects them.
- A block never imports a page.
- `AppRail`, `AppTabBar` and `MoreDrawer` take the nav pages they show as
  the `pages` prop (d-038, d-119): the page entry reads the order from
  `settingsStore` and its screen picks each bar's pages with `navLayout`
  (`lib/deviceSettings.ts`). Without the settings the screens pass the
  default order, as the Figma frames draw it (`app/NavOrderRoute.test.tsx`).
- Wrap rich content that can fail to render (markdown, code, charts) in
  `BlockBoundary` from `errors/`.
- A detail pane uses `DetailFrame` (d-107). On a tablet or phone it must
  be the AppShell detail's own child, so its sticky footer lifts above
  the tab bar.
- A screen lays out by its width through `ViewportFrame`, never by a
  story's prop or `globals.viewport` (`pnpm fidelity:check-build`
  rejects a story that sets it).
- `ScreenVariants` is for Storybook only: it shows one screen's Desktop,
  Tablet and Phone states side by side (screen review R10).
