# D06 deviations

What still differs from Figma after round 1 of the fidelity loop
(`pnpm fidelity artifacts D06`, 2026-11-17, against the installed
library 1.0.0-beta.8), each with its reason. The library gaps are in
`web/src/pages/artifacts/LIBRARY_GAPS.md`.

## Checks

- Text: fails on two extra strings, `Grid` and `List` (see "View
  switch"), as D01. Nothing is missing. `Toolkit` is an `extra` exception,
  and the four descriptions that Figma cuts with an ellipsis are `missing`
  exceptions (`exceptions.json`), as in D01 and D03.
- Position: 6 of 24 layers pass (`header`, `found status`,
  `button · Add a link`, `list tools`,
  `group · FOUND SINCE YOU LAST LOOKED`, `group · EARLIER`).
- Rules: pass. The library's scrolling pane and the four cut descriptions
  are `hiddenOverflow` exceptions, as in D01.

## Deviations

- **Sort menu place and height.** `menu · Sort` x -52.5, h +40. The menu
  opens at the Sort button's start, as Figma's, but the button sits 52.9 px
  further left (see "Search, Sort and Filter"), so the menu does too. It
  opens 4 under the button against Figma's 8 (y -4, inside the tolerance).
  Its choices are 56 px rows against Figma's 50, and it draws the
  descriptions and the note in `small` (12/16) against Figma's Regular 11
  on 14 px lines, so "Found since you last looked stays at the top." wraps
  to two lines in the 280 px menu: the menu is 323 high against 283. The
  Inbox's Sort menu (D09) has the same rows. Library gap "Sort menu rows
  and note".
- **View switch.** `view · Grid or List` x -70.9, w +70.9, as D01: the
  switch shows "Grid" and "List" beside its icons (the text check's extra
  `Grid` and `List`) and is 139 px wide against 68. Library gap
  "Icon-only view switch".
- **Search, Sort and Filter.** `search` w -52.9, `button · Sort` x -52.9,
  w +8.4, `button · Filter` x -44.4, w +4.4. The wider view switch takes
  71 px of the search's width, so Sort and Filter sit further left; Sort
  and Filter pad their sides more than Figma's 11 px. Library gaps
  "Icon-only view switch" and "Sort and Filter button widths".
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
  cold-reader chart are cyan and violet, not green and amber; the meta
  line's marks are 12 px against 14. Library gaps "Card badge at the end
  of the title row", "Desktop page title size", "Thumbnail colour" and
  "Card kind mark size".
- **Rail.** The rail's items are 60 px apart against Figma's 56, so each
  item after Inbox sits lower, and the shared rail (`AppRail`, not
  changed here: another chat holds the navigation) has a Toolkit item
  after Artifacts (d-105), which this frame does not draw, so More sits
  one item lower still. Library gap "Rail item height".
- **Sorting.** Picking a sort closes the menu and orders the cards inside
  each group (`sortCards` in `libraryView.ts`); the groups keep their
  order, so Found since you last looked stays at the top, as the frame's
  note says. The mock cards carry no update time, so Newest first keeps
  the state's order and Oldest first turns it round.

## Values picked (d-100)

Each value with no token is recorded for the library in
`LIBRARY_GAPS.md` and drawn with the library's part until it lands: the
Sort menu rows 48 high (Figma's 50 on the 4 px grid; drawn 56 by
`RadioMenu`), the menu 8 under the button (Figma's, spacing `8`; drawn 4)
and a sans text style of 11/16 for the choices' descriptions and the note
(Figma's 11 px type, its 14 px line on the 4 px grid; drawn in `small`
12/16). The menu takes `RadioMenu width="sort"` (280, Figma's) with the
heading "Sort by" in capitals and the note under a line, as the Inbox's
Sort menu, and Sort is `pressed` while it is open (Figma's cyan border).
