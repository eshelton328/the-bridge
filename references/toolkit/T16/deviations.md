# T16 deviations

What still differs from Figma after the fidelity loop
(`pnpm fidelity toolkit T16`, 2026-11-18, against library 1.0.0-beta.36:
a first run and three fix rounds), each with its reason. The library
gaps are in `web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/skillEvalsTablet.ts`: D20's data with
`results.named` set: the back row names the item (Toolkit › writer) and
the kind badge and path rows are left out, as on T10 and T15. Every
other Toolkit frame (T03, T04, T06 to T08, T10, T15, T17 to T19 and T28
to T38 and the list frames) gives the same text, position and rule
results as before the Evals tab. The frame has no `exceptions.json`.

## Checks

- Text: pass. Every Figma string is in the render and visible, and
  nothing extra shows.
- Position: 29 of 34 layers pass. The 5 that fail: `button · Discuss` x
  -7.1 y -1 w +2.5 h -2; `toolkit item` x +2 y +32 w -4 h -183; `evals`
  x +2 y -1 w -4 h -5; `badge · D6` x +3 y -2 w -7.6 h -1; `chart` x +2
  y -3 w -238 h +25. Each is explained below.
- Rules: pass.

## Deviations

- **Item frame.** Figma's `toolkit item` holds the back row and the
  item, from y 41 down to the tab bar. In `DetailFrame` the back row is
  the ScrollFrame's header and the item is the body under it, so the
  article starts under the back row and ends with the tab's source line
  (`toolkit item` x +2 y +32 w -4 h -183: the Container pads 24 at the
  sides against 22). This is the d-107 structure that keeps Back in
  view, as on T17 and T28 (gap: Tablet item spacing).
- **Back row.** The back row is 32 px high against Figma's 36 (gap: Item
  action buttons). Discuss is wider than Figma's, so it starts further
  left (`button · Discuss` x -7.1 y -1 w +2.5 h -2).
- **Line heights.** The tab's headers, its small and mono lines and its
  rows are 16 px high in the `monoCaps`, `small` and `mono` text styles
  against Figma's 17: the library keeps line heights on the 4 px grid
  (d-072). The rows sit 8 and 10 apart in turn to keep Figma's 25 and 47
  px steps on average, and the lines under the badges, the chart and the
  cases 2 px lower, so most rows stay within the tolerance; what remains
  adds up down the tab: `evals` x +2 y -1 w -4 h -5 (gap: Evals panels).
- **Chart size.** The chart is 392 wide with a group every 56 px,
  against Figma's 630 with a group every 90 (`chart` x +2 y -3 w -238 h
  +25), and 135 high with its axis inside against Figma's 110 plot:
  `GroupedBarChart` has one size. The bars keep the desktop's places, so
  the right part of the panel is empty (gap: Evals bar chart).
- **Badges.** The criteria are the library's `Badge size="sm"`, each 2
  px wider than Figma's, so they sit 4 apart against Figma's 6 and each
  stays at Figma's x. The checks and the cross are the library's 12 px
  `CheckIcon` and `CloseCircleIcon` against Figma's 11. The waiting
  criterion D6 Real use · waits has its label in the badge's one style,
  112 × 20, where Figma draws it in a larger style, 120 × 21
  (`badge · D6` x +3 y -2 w -7.6 h -1; gap: Evals criterion badge).
- **Open the ledger.** Figma draws Open the ledger in the accent colour.
  The ledger is in projects/skill-evals/, outside the toolkit, and no
  frame draws it, so the render keeps the link disabled and muted, with
  a title that says so (gap: Evals panels).
- **D5 Reviewer.** The badge opens the agent writing-reviewer on its
  Evals tab (D26; T25 on a tablet). `Badge` takes no press, so it sits
  in a plain button styled with tokens, which draws nothing of its own
  (gap: Evals panels).
- **Item tabs.** The selected tab's outline is `border.selected` at half
  alpha where Figma's is solid cyan (d-050).
