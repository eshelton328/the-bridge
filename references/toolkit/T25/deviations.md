# T25 deviations

What still differs from Figma after the fidelity loop
(`pnpm fidelity toolkit T25`, 2026-11-18, against library 1.0.0-beta.36:
a first run and three fix rounds), each with its reason. The library
gaps are in `web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/agentEvalsTablet.ts`: D26's data with
`ui.from` set to writer, the state that writer's D5 Reviewer badge gives
on T16: T7's breadcrumb Toolkit › writer › writing-reviewer over T7's
header. Every other Toolkit frame (T03, T04, T06 to T08, T10, T15, T17
to T19 and T28 to T38 and the list frames) gives the same text, position
and rule results as before the Evals tab. The frame has no
`exceptions.json`.

## Checks

- Text: pass. Every Figma string is in the render and visible, and
  nothing extra shows.
- Position: 29 of 34 layers pass. The 5 that fail: `button · Discuss` x
  -5.1 y -1 w +2.5 h -2; `toolkit item` x +2 y +32 w -4 h -286;
  `492:2709` x +2 y -3 w +14.7 h +2; `evals` x +2 y -2 w -4 h -6;
  `round · reviewer-1` x +2 y -5 w -4 h -1. Each is explained below.
- Rules: pass.

## Deviations

- **Item frame.** Figma's `toolkit item` holds the back row and the
  item, from y 41 down to the tab bar. In `DetailFrame` the back row is
  the ScrollFrame's header and the item is the body under it, so the
  article starts under the back row and ends with the tab's source line
  (`toolkit item` x +2 y +32 w -4 h -286: the Container pads 24 at the
  sides against 22). This is the d-107 structure that keeps Back in
  view, as on T17 and T28 (gap: Tablet item spacing).
- **Back row.** The back row is 32 px high against Figma's 36 (gap: Item
  action buttons). Discuss is wider than Figma's, so it starts further
  left (`button · Discuss` x -5.1 y -1 w +2.5 h -2).
- **Title width.** The title renders wider than Figma's (`492:2709` x +2
  y -3 w +14.7 h +2), as on T17, T37 and T38: the heading text style
  draws the name a little wider.
- **Line heights.** The tab's headers, its small and mono lines and its
  rows are 16 px high in the `monoCaps`, `small` and `mono` text styles
  against Figma's 17: the library keeps line heights on the 4 px grid
  (d-072). The rows sit 8 and 10 apart in turn to keep Figma's 25 and 47
  px steps on average, and the lines under the badges, the chart and the
  cases 2 px lower, so most rows stay within the tolerance; what remains
  adds up down the tab: `evals` x +2 y -2 w -4 h -6;
  `round · reviewer-1` x +2 y -5 w -4 h -1 (gap: Evals panels).
- **Open the ledger.** Figma draws Open the ledger in the accent colour.
  The ledger is in projects/skill-evals/, outside the toolkit, and no
  frame draws it, so the render keeps the link disabled, in the accent colour at the
  disabled opacity, with
  a title that says so (gap: Evals panels).
- **Item tabs.** Each unselected tab is 1.3 to 1.8 px wider than
  Figma's: `ItemTabs` gives every tab a 1 px transparent border, where
  Figma draws a border only on the selected tab. So Activity ends at
  472.3 against Figma's 463, 2 px of it the Container's 24 px side
  (gap: Item tab width). The selected tab's outline is `border.selected` at half
  alpha where Figma's is solid cyan (d-050).
- **Agent badge.** Figma's Agent badge (`kind badge` 492:2704) has a
  1 px outline in the agent colour around a raised fill, and its label
  in a light grey. `KindBadge` takes only `kind`: it draws the tinted
  pill with no outline and its label in the agent colour, as on T07,
  the agent's Overview from writer (gap: Kind badge outline).
- **Badge icon.** The D5 Reviewer badge's check is the library's 12 px
  `CheckIcon` against Figma's 11 px icon. Its stroke is 1 px, where
  Figma's is about 2 px wide, so the render's check is thinner; no icon
  takes a weight (gap: Evals criterion badge).
