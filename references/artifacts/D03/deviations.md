# D03 deviations

What still differs from Figma after round 2 of the fidelity loop
(`pnpm fidelity artifacts D03`, 2026-11-17, against the installed
library 1.0.0-beta.8), each with its reason. The library gaps are in
`web/src/pages/artifacts/LIBRARY_GAPS.md`.

## Checks

- Text: fails on two extra strings, `Grid` and `List` (see "View
  switch"), as D01. Nothing is missing. `Toolkit` is an `extra` exception,
  and the four descriptions that Figma cuts with an ellipsis are `missing`
  exceptions (`exceptions.json`).
- Position: 6 of 37 layers pass (`header`, `found status`,
  `button · Add a link`, `list tools`,
  `group · FOUND SINCE YOU LAST LOOKED`, `group · EARLIER`).
- Rules: pass. The library's scrolling pane and the four cut descriptions
  are `hiddenOverflow` exceptions, as in D01.

## Deviations

- **Filter menu place.** `menu · Filter` x +75.5. Figma opens the menu
  where the search ends, 120 px before the Filter button's start; the
  `Popover` opens at the button's start (`placement="bottom-start"`), so
  the menu sits about 75 px further right and covers the third card more
  than the second. Library gap "Filter menu placement".
- **Filter menu rows.** `menu · Filter` h +46, and every row:
  `check · Claude artifacts`, `check · Codex sites`, `check · ncc-1701`,
  `check · omni`, `check · skill-evals`, `check · omni-brain`,
  `check · Not in a project`, `check · Artifact hook`,
  `check · Codex session log`, `check · Added by hand`, `check · Today`
  and `check · This week`, each x +71.5 (the menu's place, above) and
  w +8, and from `check · ncc-1701` on y +6 growing to +41. The
  `Checkbox` rows are 32 high and 34 apart against Figma's 29 (28 for a
  mono label) and 31 or 30, so each row sits a little lower than the one
  before it and the menu is 590 high against 544. `Popover` pads 8
  against Figma's 12, so the rows are 302 wide against 294 and start 4 px
  nearer the menu's edge. `button · Show 7` x +73.8, y +42: the footer
  follows the rows down. Library gap "Filter menu rows and inset".
- **Source marks.** The Claude artifacts and Codex sites rows have no
  Claude or Codex mark between the box and the label: `Checkbox` takes
  only a text label. Library gap "Checkbox leading icon".
- **View switch.** `view · Grid or List` x -70.9, w +70.9, as D01: the
  switch shows "Grid" and "List" beside its icons (the text check's extra
  `Grid` and `List`) and is 139 px wide against 68. Library gap
  "Icon-only view switch".
- **Search, Sort and Filter.** `search` w -52.9, `button · Sort` x -52.9,
  w +8.4, `button · Filter` x -44.4, w +4.4. The wider view switch takes
  71 px of the search's width, so Sort and Filter sit further left; Sort
  and Filter (with its dot) pad their sides more than Figma's 11 px.
  Library gaps "Icon-only view switch" and "Sort and Filter button
  widths".
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
- **Show.** Show 7 closes the menu. The cards carry no finder or update
  data yet, so the grid does not narrow to the seven artifacts; the note
  and the Show count are the state's text.

## Values picked (d-100)

Each value with no token is recorded for the library in
`LIBRARY_GAPS.md` and drawn with the library's part until it lands: the
Filter menu row 28 high (`control.sm`, Figma's 28 on the 4 px grid; drawn
32 by `Checkbox`), the popover padding 12 (Figma's, spacing `12`; drawn
8 by `Popover`), and the Source rows' marks `KindMark size="12"` (the
library's size for Figma's 13 px mark; not drawn). The menu takes
`Popover width="md"` (320, Figma's), its rows `Checkbox size="compact"`
(Figma's 13 px labels, `monoSm` counts) padded 8 as the Inbox's Filter
menu, the project names `labelStyle="mono"`, Filter `pressed` and
`indicator` (Figma's cyan border and dot) and Show 7
`Button variant="primary"` (32 high, Figma's).
