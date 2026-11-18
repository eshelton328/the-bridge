# D06 deviations

What still differs from Figma after round 1 of the fidelity loop
(`pnpm fidelity artifacts D06`, 2026-11-17, against the installed
library 1.0.0-beta.19), each with its reason. The library gaps are in
`web/src/pages/artifacts/LIBRARY_GAPS.md`.

## Checks

- Text: passes. Nothing is missing or extra: the view switch draws its
  icons alone (`ViewSwitch iconOnly`, library #121). The open Sort menu
  covers no card text: `40m` (403:8594), `ncc-1701` (403:8726), `Claude`
  (403:8753) and `·` (403:8754) are visible with no exception (see "Sort
  menu place"). `Toolkit` is an `extra` exception, and the four
  descriptions that Figma cuts with an ellipsis are `missing` exceptions
  (`exceptions.json`), as in D01 and D03.
- Position: 11 of 30 layers pass (`header`, `found status`,
  `button · Add a link`, `list tools`, `view · Grid or List`,
  `group · FOUND SINCE YOU LAST LOOKED`, `group · EARLIER`).
  The shared navigation's items pass too: `rail · Inbox`,
  `rail · Workspaces`, `rail · Projects` and `rail · Artifacts`.
- Rules: pass. The library's scrolling pane and the four cut descriptions
  are `hiddenOverflow` exceptions, as in D01.

## Deviations

- **Sort menu place.** `menu · Sort` x -17.5. The menu opens at the
  Sort button's start, as Figma's, and Sort sits 17.4 px left of Figma's
  (see "Search, Sort and Filter"), so the menu does too. `RadioMenu
  density="compact"` (library #121) draws it 280 × 283 at y 150, 8 under
  Sort, as Figma's (403:8881): its choices are 48 high and 4 apart with
  the descriptions and the note in `smallXs` (Regular 11/16), and the
  note fits one line. The menu ends at y 433, above the cards' meta lines
  (y 454), so it covers none of their text.
- **Search, Sort and Filter.** `search` w -17.4, `button · Sort` x -17.4,
  w +8.4, `button · Filter` x -9, w +4.4, as D01: Sort and Filter pad
  their sides more than Figma's 11 px, and the search and the space
  before the view switch share the free width equally where Figma gives
  the search 22 px more. Library gap "Sort and Filter button widths".
- **Source chips.** `filter · chips` w +7.2: the chips are 6 apart with
  8 px sides against Figma's 5 and 9. Library gap "Compact chip spacing".
- **Card heights.** Every card is 5.2 px shorter than Figma's 286:
  `artifact card · Skill eval pass rates`,
  `artifact card · Hono server spike`,
  `artifact card · Inbox task lifecycle`,
  `artifact card · Tailscale access check`,
  `artifact card · the-bridge theme ideas`,
  `artifact card · Application versioning and releases`,
  `artifact card · Panda tokens playground`,
  `artifact card · Agent factory and session tracking`,
  `artifact card · Brain map prototype`,
  `artifact card · Type safety in agentic systems`,
  `artifact card · Logo options` and
  `artifact card · readme cold-reader run`, each h -5.2, as D01: 16 px
  description and meta lines (4 px grid, d-100) against 17, and a
  186.75 px thumbnail against 188. Library gap "Card body and line
  heights".
- **New badge, page title, thumbnails and card marks.** As D01: New sits
  8 px after the card title, not at the end of the row; "Artifacts" is
  20 px type against about 24; the Agent factory doc and the readme
  cold-reader chart are cyan and violet, not green and amber, the Type
  safety doc's title bar is cyan, not violet, and the chart bars are a
  brighter cyan than Figma's muted teal-cyan (`Thumbnail` takes no colour
  prop); the meta
  line's marks are 12 px against 14. Library gaps "Card badge at the end
  of the title row", "Desktop page title size", "Thumbnail colour" and
  "Card kind mark size".
- **Nav rail.** Figma's rail has no Toolkit item, so `rail · Toolkit`
  has no layer, and `rail · More` sits 52 px lower (y +52). The design
  predates d-105, which adds the Toolkit (and Artifacts) item; the app
  draws the six-item navigation.
- **Sorting.** Picking a sort closes the menu and orders the cards inside
  each group (`sortCards` in `libraryView.ts`); the groups keep their
  order, so Found since you last looked stays at the top, as the frame's
  note says. The mock cards carry no update time, so Newest first keeps
  the state's order and Oldest first turns it round.

## Values picked (d-100)

The menu takes `RadioMenu width="sort"` (280, Figma's) and
`density="compact"` with the heading "Sort by" in capitals and the note
under a line, as the Inbox's Sort menu, and Sort is `pressed` while it is
open (Figma's cyan border). The compact rows are 48 high, Figma's 50 on
the 4 px grid.
