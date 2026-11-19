# D06 deviations

What still differs from Figma after round 1 of the fidelity loop
(`pnpm fidelity artifacts D06`, 2026-11-17, against the installed
library 1.0.0-beta.19), each with its reason. The library gaps are in
`web/src/pages/artifacts/LIBRARY_GAPS.md`.

Checked again 2026-11-18 with library 1.0.0-beta.36 (`pnpm fidelity
artifacts`): the text, position and rules results did not change.
Checked again 2026-11-19 with library 1.0.0-beta.69 (card `tone`,
compact Sort and Filter): the text, position and rules results did not
change.

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

- **Rail Artifacts icon.** Figma draws it in a 20 px frame (414:966); its
  other rail icons are 22 px. The shared `AppRail` draws every item's
  icon at 24 (`NavRail`, d-100), so the 22 px ones pass the iconSize
  check (2 px slack) and this one does not. A position exception
  names 414:966 (2026-11-19, the same decision on every page's rail).
- **Sort menu place.** `menu · Sort` x -11.5. The menu opens at the
  Sort button's start, as Figma's, and Sort sits 11.4 px left of Figma's
  (see "Search, Sort and Filter"), so the menu does too. `RadioMenu
  density="compact"` (library #121) draws it 280 × 283 at y 150, 8 under
  Sort, as Figma's (403:8881): its choices are 48 high and 4 apart with
  the descriptions and the note in `smallXs` (Regular 11/16), and the
  note fits one line. The menu ends at y 433, above the cards' meta lines
  (y 454), so it covers none of their text.
- **Search, Sort and Filter.** `search` w -11.4, `button · Sort` x -11.4,
  `button · Filter` x -11, as D01: Sort (108.4) and Filter (75.4) take
  `padding="compact"` and are Figma's widths, but the search and the
  space before the view switch share the free width equally where Figma
  gives the search 22 px more, so the search is 554.1 wide against 565.5.
  Library gap "Sort and Filter button widths".
- **Source chips.** `filter · chips` w +7.2. `FilterChips size="compact"`
  draws Figma's 9 px sides (8 px padding in a 1 px border) and puts the
  chips 6 apart against Figma's 5: 5 ties 4 and 6 on the 4 px grid and the
  tie takes the larger (d-072), so no library change closes it. Library
  gap "Compact chip spacing".
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
- **Thumbnails and card marks.** As D01: the Agent factory doc is green,
  the Type safety doc violet and the readme cold-reader chart amber, as
  Figma's (`Thumbnail tone`, library 1.0.0-beta.68), but the chart bars
  are a brighter cyan than Figma's muted teal-cyan. Library gap
  "Thumbnail colour".
- **Card kind mark (2026-11-18).** Library beta.51 (#168) draws the
  leading mark of `MetaLine icon="md"` at 16 px, so the Claude and Codex
  marks in the meta line are 16 px against Figma's 14 (d-100: 14 ties
  12 and 16 on the 4 px icon scale, and the tie takes 16). They were 12.
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
