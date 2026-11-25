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
  The order holds Settings too (`BarPage`): the tab bar draws it as a tab
  when it fits, and ends with More only when `navLayout`'s `more` is
  not empty (`AppTabBar`'s `more`).
- `AppRail` draws the Settings gear and `MoreDrawer` the Settings row only
  with `settings` (d-119). Each page entry passes `settingsEntry` to its
  screen, which passes it on; a Figma page's states pass none, as Figma
  draws neither (`app/SettingsEntryRoute.test.tsx` fails when an entry
  stops passing it).
- Wrap rich content that can fail to render (markdown, code, charts) in
  `BlockBoundary` from `errors/`.
- `MarkdownText` draws only the rich text features that are on
  (Settings → Rich text): its `features` prop, or else
  `MarkdownFeaturesContext` (`markdownFeatures.ts`), every feature with
  no provider. A feature that is off draws its plain Markdown and hides no
  text; `MarkdownFeatures.test.tsx` has one case for each feature. Read
  the context with its Consumer, never `use`: the canvas runs React 18.
- A detail pane uses `DetailFrame` (d-107). On a tablet or phone it must
  be the AppShell detail's own child, so its sticky footer lifts above
  the tab bar.
- A screen lays out by its width through `ViewportFrame`, never by a
  story's prop or `globals.viewport` (`pnpm fidelity:check-build`
  rejects a story that sets it).
- `ScreenVariants` is for Storybook only: it shows one screen's Desktop,
  Tablet and Phone states side by side (screen review R10).
