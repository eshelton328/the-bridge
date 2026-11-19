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

- **Filter menu place.** `menu · Filter` x +109.5. Figma opens the menu
  where the search ends, 120 px before the Filter button's start; the
  `Popover` opens at the button's start (`placement="bottom-start"`), and
  Filter sits 11 px left of Figma's (see "Search, Sort and Filter"), so
  the menu sits 109.5 px further right and covers the third card more
  than the second. Library gap "Filter menu placement".
- **Filter menu rows.** `menu · Filter` h +38, and every row:
  `check · Claude artifacts`, `check · Codex sites`, `check · ncc-1701`,
  `check · omni`, `check · skill-evals`, `check · omni-brain`,
  `check · Not in a project`, `check · Artifact hook`,
  `check · Codex session log`, `check · Added by hand`, `check · Today`
  and `check · This week`, each x +107.5 (the menu's place, above) and
  w +8, and from `check · omni` on y +6 growing to +33. The
  `Checkbox` rows are 32 high and 34 apart against Figma's 29 (28 for a
  mono label) and 31 or 30, so each row sits a little lower than the one
  before it and the menu is 582 high against 544. `Popover` pads 8
  against Figma's 12, so the rows are 302 wide against 294 and start 4 px
  nearer the menu's edge. `button · Show 7` x +109.8, y +34: the footer
  follows the rows down. Library gap "Filter menu rows and inset".
- **Source marks.** The Claude artifacts and Codex sites rows have no
  Claude or Codex mark between the box and the label: `Checkbox` takes
  only a text label. Library gap "Checkbox leading icon".
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
