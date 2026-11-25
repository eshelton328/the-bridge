# toolkit

The Toolkit page: every agent, skill, workflow, rule and hook in the
brain's `toolkit/`, read-only. Its Figma frames are `D*` (desktop),
`T*` (tablet) and `M*` (phone) on the Figma page Toolkit.

## Rules

- `ToolkitPage.tsx` keeps the owner's changes to the state's `ui` in
  React state until another state loads, and writes the clipboard for
  `onCopyPath` and `onCopyText`.
- While the route loads, `ToolkitPending.tsx` draws the home itself
  (R58) and keeps the owner's changes in `toolkitStore.ts`; the loaded
  home starts from them once and empties the store. Both entries write
  the clipboard the same way (`app/ToolkitPendingFit.test.tsx`).
- A press that changes the view reports a `ui` change through
  `onUiChange`. Without that prop
  `ToolkitScreen` keeps the changes itself, so a story or a canvas board
  can still use the chips, the search and the tabs.
- `home.ts` merges the details of the state files (`mergeDetails`), so
  an item opens from the home as complete as any state shows it. A state
  that adds an item's details adds them there too
  (`app/ToolkitHome.test.tsx`).
- On the desktop a full page sits in the library's `Container
  size="page"` and an open item in `size="item"`; use no fixed width
  (`app/ToolkitWideScreen.test.tsx`).
- On a tablet or phone an open item, the Activity view, a discussion, a
  run and a chat sit in the shared `DetailFrame`, so the back row stays
  at the top (d-107, `app/ToolkitStickyBack.test.tsx`).
- On a tablet or phone Back shows the list at the scroll it had when the
  item opened (screen review R11).
- Opening another item, or none, closes and empties the discussion
  (`withDiscussReset`, `app/ToolkitDiscuss.test.tsx`).
- A control whose target no state or flow has (Open in Workbench, Open
  the ledger) stays disabled with a title that says why.
- A part or token the library cannot draw is a row in
  [LIBRARY_GAPS.md](LIBRARY_GAPS.md), filled by the `library-gap-filler`
  agent (d-104). Use the part named there under "Used now" until then.
- Tests of the page's pure modules and blocks sit at the page root, named
  after the module (`listView.test.ts`); route and layout tests are
  `web/src/app/Toolkit*.test.tsx`.

## Folders

- [screens/AGENTS.md](screens/AGENTS.md): read before you change the
  screen, its stories or the screen's view logic.
- [blocks/AGENTS.md](blocks/AGENTS.md): read before you add or change a
  block or a block's pure helper.
- [states/AGENTS.md](states/AGENTS.md): read before you add a Figma
  state or change the screen map.
