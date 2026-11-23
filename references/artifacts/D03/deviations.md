# D03 deviations

What still differs from Figma after round 2 of the fidelity loop
(`pnpm fidelity artifacts D03`, 2026-11-17, against the installed
library 1.0.0-beta.19), each with its reason. The library gaps are in
`web/src/pages/artifacts/LIBRARY_GAPS.md`.

Checked again 2026-11-18 with library 1.0.0-beta.36 (`pnpm fidelity
artifacts`): the text, position and rules results did not change.
Checked again 2026-11-19 with library 1.0.0-beta.69 (card `tone`,
compact Sort and Filter): the text, position and rules results did not
change.
Checked again 2026-11-19 with library 1.0.0-beta.80 (`Checkbox
density="compact"` and `leading`, `Popover inset="wide"`): the menu is
Figma's height and its rows Figma's height and width; the position
count did not change, as the rows still differ by the menu's place.

## Checks

- Text: passes, as D01: the view switch draws its icons alone
  (`ViewSwitch iconOnly`, library #121). `Toolkit` is an `extra` exception,
  and the four descriptions that Figma cuts with an ellipsis are `missing`
  exceptions (`exceptions.json`).
- Position: 11 of 43 layers pass (`header`, `found status`,
  `button · Add a link`, `list tools`, `view · Grid or List`,
  `group · FOUND SINCE YOU LAST LOOKED`, `group · EARLIER`).
  The shared navigation's items pass too: `rail · Inbox`,
  `rail · Workspaces`, `rail · Projects` and `rail · Artifacts`.
- Rules: pass. The library's scrolling pane and the four cut descriptions
  are `hiddenOverflow` exceptions, as in D01.

## Deviations

- **Rail Artifacts icon.** Figma draws it in a 20 px frame (414:942); its
  other rail icons are 22 px. The shared `AppRail` draws every item's
  icon at 24 (`NavRail`, d-100), so the 22 px ones pass the iconSize
  check (2 px slack) and this one does not. A position exception
  names 414:942 (2026-11-19, the same decision on every page's rail).
- **Filter menu place.** `menu · Filter` x +109.5. Figma opens the menu
  where the search ends, 120 px before the Filter button's start; the
  `Popover` opens at the button's start (`placement="bottom-start"`), and
  Filter sits 11 px left of Figma's (see "Search, Sort and Filter"), so
  the menu sits 109.5 px further right and covers the third card more
  than the second. The menu stays under its own button: this is decided
  with no library change (LIBRARY_GAPS.md, "Decided with no library
  change").
- **Filter menu rows.** Since library 1.0.0-beta.80 the rows are
  `Checkbox density="compact"`, 28 high and 30 apart in their
  `PopoverSection`, and the menu is `Popover inset="wide"`, padded 12, so
  the menu is Figma's 544 high and the rows 294 wide, as Figma's. Every
  row (`check · Claude artifacts` to `check · This week`) is x +109.5,
  the menu's place (above), and nothing else from `check · Claude
  artifacts` to `check · Codex session log`. `check · Added by hand`
  y -5, `check · Today` y -6, `check · This week` y -7 and
  `button · Show 7` x +103.8, y -10: Figma puts some rows 31 apart and
  its footer a little lower, where the render keeps 30 (28 on the 4 px
  grid, d-100). Before, the 32 px rows put the last row 33 low and the
  menu was 38 px taller. Closed by 1.0.0-beta.80 (LIBRARY_GAPS.md).
- **Source marks.** The Claude artifacts and Codex sites rows draw the
  Claude and Codex marks between the box and the label (`Checkbox
  leading`, `KindMark size="12"`, library 1.0.0-beta.80): 12 px against
  Figma's 13 (403:6855, 403:6865), the label 24 after the box against 23.
- **Search, Sort and Filter.** `search` w -11.4, `button · Sort` x -11.4,
  `button · Filter` x -11, as D01: Sort (108.4, Figma 108) and Filter
  with its dot (87.4, Figma 87) take `padding="compact"`, and the search
  and the space before the view switch share the free width equally
  where Figma gives the search 22 px more, so the search is 548.1 wide
  against 559.5. Library gap "Sort and Filter button widths".
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
- **Show.** Show 7 closes the menu. The cards carry no finder or update
  data yet, so the grid does not narrow to the seven artifacts; the note
  and the Show count are the state's text.

## Values picked (d-100)

The Filter menu row is 28 high (`Checkbox density="compact"`,
`control.sm`, Figma's 28 on the 4 px grid), the popover padding 12
(`Popover inset="wide"`, Figma's) and the Source rows' marks
`KindMark size="12"` (the library's size for Figma's 13 px mark), all
since library 1.0.0-beta.80. The menu takes
`Popover width="md"` (320, Figma's), its rows `Checkbox size="compact"`
(Figma's 13 px labels, `monoSm` counts) padded 8 as the Inbox's Filter
menu, the project names `labelStyle="mono"`, Filter `pressed` and
`indicator` (Figma's cyan border and dot) and Show 7
`Button variant="primary"` (32 high, Figma's).

## Settings gear (d-119)

In the app, the rail has a Settings gear before More, which this frame
does not draw: Settings has no Figma page, and decision d-119 puts its
entry in the rail (`web/src/blocks/AppRail.tsx`). The Notifications
switch that d-118 put at the rail's end moved to the Settings page, so
the rail no longer draws it.
