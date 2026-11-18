# blocks

Blocks that two or more pages use (d-088, d-089): composites of library
parts, such as `AppRail`. A block starts in its page's `blocks/` and moves
here when a second page needs it.

- `AppRail`: the desktop nav rail; `AppTabBar`: the tablet and phone tab
  bar (Home and the four pages).
- `MoreDrawer`: the phone's More drawer (Toolkit M4) on the library's
  `MoreDrawer`: Artifacts and Toolkit, then Brain and Workflows under
  Later. A screen opens it from the phone tab bar's More and passes
  `onNavigate` for Artifacts and Toolkit.
- `DetailFrame`: a detail pane (d-107) in the library's `ScrollFrame`:
  Back in its header on a tablet or phone, the content in the layout's
  `Container`, and a footer that stays sticky at the end, at
  `bottom: var(--scroll-frame-inset, 0px)`. On a tablet or phone it is
  the AppShell detail's own child, so with `tabBarOverlay` it reaches
  under the tab bar and lifts the footer and the item's end above it. The Inbox
  details use it first; Toolkit and Artifacts use it for an open item.
- `ViewportFrame`: fills its parent, measures its width and renders a
  page screen for that width's layout (`lib/viewport.ts`). A screen lays
  out by its width, never by a story's prop or `globals.viewport`.

## Rules

- Props-only: data in as props, changes out through callbacks. No
  store, router, `fetch` or storage; the lint rejects them.
- A block never imports a page.
- Wrap rich content that can fail to render (markdown, code, charts) in
  `BlockBoundary` from `errors/`.
