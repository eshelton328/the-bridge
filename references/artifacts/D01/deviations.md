# D01 deviations

What still differs from Figma after round 2 of the fidelity loop
(`pnpm fidelity artifacts D01`, 2026-11-17, against the installed
library 1.0.0-beta.15), each with its reason. The library gaps are in
`web/src/pages/artifacts/LIBRARY_GAPS.md`.

## Checks

- Text: fails on two extra strings, `Grid` and `List` (see "View
  switch"). Nothing is missing. `Toolkit` is an `extra` exception, and the
  four descriptions that Figma cuts with an ellipsis are `missing`
  exceptions (`exceptions.json`).
- Position: 6 of 23 layers pass (`header`, `found status`,
  `button · Add a link`, `list tools`,
  `group · FOUND SINCE YOU LAST LOOKED`, `group · EARLIER`).
- Rules: pass. The library's scrolling pane and the four cut descriptions
  are `hiddenOverflow` exceptions: Figma draws the third card row past the
  frame's bottom edge and cuts the same descriptions.

## Deviations

- **View switch.** `view · Grid or List` x -66.9, w +66.9. Figma's switch
  is two icon-only segments, 68 px wide; `ViewSwitch` always shows its
  labels, so the render shows "Grid" and "List" beside the icons (the
  text check's extra `Grid` and `List`), and the switch is 135 px wide.
  It draws the picked view in `tone="accent"` (cyan icon, no border), as
  Figma does. Library gap "Icon-only view switch".
- **Search, Sort and Filter.** `search` w -50.9, `button · Sort` x -50.9,
  w +8.4, `button · Filter` x -42.4, w +4.4. The search and the space
  before the view switch share the row's free width, as Figma's layers
  do (402:15398, 402:15418); the wider view switch takes 67 px of it, so
  the search is 51 px narrower and Sort and Filter sit further left.
  Sort and Filter are wider because `Button textSize="sm"` pads its sides
  more than Figma's 11 px. Library gaps "Icon-only view switch" and "Sort
  and Filter button widths".
- **Source chips.** `filter · chips` w +7.2. `FilterChips size="compact"`
  puts the chips 6 apart with 8 px sides; Figma has 5 apart and 9 px
  sides. Library gap "Compact chip spacing".
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
- **New badge.** New sits 8 px after the card title; Figma puts it at the
  end of the title row. Library gap "Card badge at the end of the title
  row".
- **Page title.** "Artifacts" is 20 px type (`PageHeader size="page"`)
  against Figma's text box of 29 px, about 24 px type, so the title and
  count are smaller. Library gap "Desktop page title size".
- **Thumbnail colours.** The Agent factory doc's title bar is cyan, not
  Figma's green; the Type safety in agentic systems doc's title bar is
  cyan, not violet (402:15716); the readme cold-reader chart is cyan and
  violet, not amber; and the chart bars are a brighter cyan than Figma's
  muted teal-cyan. `Thumbnail` draws one colour set per kind and takes no
  colour or tone prop. Library gap "Thumbnail colour".
- **Card kind mark.** The Claude and Codex marks in the meta line are
  12 px against Figma's 14. Library gap "Card kind mark size".
- **Rail.** The shared rail (`AppRail`, not changed here: another chat
  holds the navigation) has a Toolkit item after Artifacts (d-105), which
  this frame does not draw, so More sits one item lower. The rest of the
  rail matches.

## Values picked (d-100)

No value in this frame needed a new pick: the library's page padding
(32 at the sides, 24 at the top), its row gaps (12), the card gap (16) and
the 24 px gap before Add a link (`me: 16` plus the header's 8) are
Figma's values and spacing tokens. The New badge takes `tone="working"`
(cyan, as Figma's) and `size="sm"` (20 px, Figma 18); the group's New dot
takes `dot="working"`.
