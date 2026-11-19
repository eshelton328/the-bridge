# D01 deviations

What still differs from Figma after round 2 of the fidelity loop
(`pnpm fidelity artifacts D01`, 2026-11-17, against the installed
library 1.0.0-beta.19), each with its reason. The library gaps are in
`web/src/pages/artifacts/LIBRARY_GAPS.md`.

Checked again 2026-11-18 with library 1.0.0-beta.36 (`pnpm fidelity
artifacts`): the text, position and rules results did not change.
Checked again 2026-11-19 with library 1.0.0-beta.69 (card `tone`,
compact Sort and Filter): the text, position and rules results did not
change.

## Checks

- Text: passes. Nothing is missing and nothing extra shows: the view
  switch draws its icons alone (`ViewSwitch iconOnly`, library #121).
  `Toolkit` is an `extra` exception, and the
  four descriptions that Figma cuts with an ellipsis are `missing`
  exceptions (`exceptions.json`).
- Position: 11 of 29 layers pass (`header`, `found status`,
  `button · Add a link`, `list tools`, `view · Grid or List`,
  `group · FOUND SINCE YOU LAST LOOKED`, `group · EARLIER`).
  The shared navigation's items pass too: `rail · Inbox`,
  `rail · Workspaces`, `rail · Projects` and `rail · Artifacts`.
- Rules: pass. The library's scrolling pane and the four cut descriptions
  are `hiddenOverflow` exceptions: Figma draws the third card row past the
  frame's bottom edge and cuts the same descriptions.

## Deviations

- **Rail Artifacts icon.** Figma draws it in a 20 px frame (414:926); its
  other rail icons are 22 px. The shared `AppRail` draws every item's
  icon at 24 (`NavRail`, d-100), so the 22 px ones pass the iconSize
  check (2 px slack) and this one does not. A position exception
  names 414:926 (2026-11-19, the same decision on every page's rail).
- **Search, Sort and Filter.** `search` w -11.4, `button · Sort` x -11.4,
  `button · Filter` x -11. Sort and Filter take `padding="compact"`
  (10 px sides, Sort with `keepIconSize`): Sort is 108.4 wide (Figma 108)
  and Filter 75.4 (Figma 75). The search and the space before the view
  switch share the row's free width, as Figma's layers do (402:15398,
  402:15418), but Figma gives the search 22 px more than the space (565.5)
  and no token gives an uneven share, so the search is 554.1 wide and
  Sort and Filter start 11 px early. Library gap "Sort and Filter button
  widths".
- **Source chips.** `filter · chips` w +7.2. `FilterChips size="compact"`
  draws Figma's 9 px sides (8 px padding in a 1 px border) and puts the
  chips 6 apart against Figma's 5: 5 ties 4 and 6 on the 4 px grid and the
  tie takes the larger (d-072), so no library change closes it. Library
  gap "Compact chip spacing".
- **Card heights.** Every card is 5.2 px shorter than Figma's 286:
  `artifact card · Skill eval pass rates`, `artifact card · Hono server spike`,
  `artifact card · Inbox task lifecycle`, `artifact card · Tailscale access check`,
  `artifact card · the-bridge theme ideas`,
  `artifact card · Application versioning and releases`,
  `artifact card · Panda tokens playground`,
  `artifact card · Agent factory and session tracking`,
  `artifact card · Brain map prototype`,
  `artifact card · Type safety in agentic systems`,
  `artifact card · Logo options` and
  `artifact card · readme cold-reader run`, each h -5.2. The description
  and meta lines are 16 px against Figma's 17 (the 4 px grid, d-100), and
  the thumbnail is 186.75 high at the card's inner 332 px against Figma's
  188. The card's sides are 16 px against Figma's 14, so its text starts
  2 px further right. Library gap "Card body and line heights".
- **Thumbnail colours.** The Agent factory doc's title bar is green, the
  Type safety in agentic systems doc's violet and the readme cold-reader
  chart amber, as Figma's (`Thumbnail tone`, library 1.0.0-beta.68). The
  chart bars are still a brighter cyan than Figma's muted teal-cyan, and
  every third bar stays violet. Library gap "Thumbnail colour".
- **Card kind mark (2026-11-18).** Library beta.51 (#168) draws the
  leading mark of `MetaLine icon="md"` at 16 px, so the Claude and Codex
  marks in the meta line are 16 px against Figma's 14 (d-100: 14 ties
  12 and 16 on the 4 px icon scale, and the tie takes 16). They were 12.
- **Nav rail.** Figma's rail has no Toolkit item, so `rail · Toolkit`
  has no layer, and `rail · More` sits 52 px lower (y +52). The design
  predates d-105, which adds the Toolkit (and Artifacts) item; the app
  draws the six-item navigation.

## Values picked (d-100)

No value in this frame needed a new pick: the library's page padding
(32 at the sides, 24 at the top), its row gaps (12), the card gap (16) and
the 24 px gap before Add a link (`me: 16` plus the header's 8) are
Figma's values and spacing tokens. The New badge takes `tone="working"`
(cyan, as Figma's) and `size="sm"` (20 px, Figma 18); the group's New dot
takes `dot="working"`.
