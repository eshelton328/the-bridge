# D01 deviations

What still differs from Figma after round 2 of the fidelity loop
(`pnpm fidelity artifacts D01`, 2026-11-17, against the installed
library 1.0.0-beta.19), each with its reason. The library gaps are in
`web/src/pages/artifacts/LIBRARY_GAPS.md`.

Checked again 2026-11-18 with library 1.0.0-beta.36 (`pnpm fidelity
artifacts`): the text, position and rules results did not change.

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

- **Search, Sort and Filter.** `search` w -17.4, `button · Sort` x -17.4,
  w +8.4, `button · Filter` x -9, w +4.4. The search and the space before
  the view switch share the row's free width, as Figma's layers do
  (402:15398, 402:15418). Sort and Filter are 12.8 px wider than Figma's
  because `Button textSize="sm"` pads its sides more than Figma's 11 px,
  which takes 6.4 px from each share. Figma also gives the search 22 px
  more than the space (565.5 against 543.5), and no token gives an uneven
  share, so the equal shares make the search 11 px narrower still. Sort
  sits 17.4 px and Filter 9 px left of Figma's. Library gap "Sort and
  Filter button widths".
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
- **Page title.** "Artifacts" is 20 px type (`PageHeader size="page"`)
  against Figma's text box of 29 px, about 24 px type, so the title and
  count are smaller. Library gap "Desktop page title size".
- **Thumbnail colours.** The Agent factory doc's title bar is cyan, not
  Figma's green; the Type safety in agentic systems doc's title bar is
  cyan, not violet (402:15716); the readme cold-reader chart is cyan and
  violet, not amber; and the chart bars are a brighter cyan than Figma's
  muted teal-cyan. `Thumbnail` draws one colour set per kind and takes no
  colour or tone prop. Library gap "Thumbnail colour".
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
