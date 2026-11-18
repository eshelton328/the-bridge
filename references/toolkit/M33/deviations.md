# M33 deviations

What still differs from Figma after round 1 of the fidelity loop
(`pnpm fidelity toolkit M33`, 2026-11-18, against the installed library
1.0.0-beta.31), each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/workflowLinksPhone.ts`: T30's data
(`workflowLinksTablet`, D31's links). On the phone the workflow keeps its
header in the shared `DetailFrame` (d-107), as on M21: Back to Toolkit
with the icon buttons, the kind badge with when it changed, the name and
the path badge. The graph stands upright (`linksGraph`'s `phone` size, as
on M17), two items on each side, and the two panels stand one under the
other. Round 1 narrowed the gap in each link's top row from 8 to 4, so
`skills/eval-cases/SKILL.md:97` (493:6672) ends inside its row; it was
cut by 3 px on the first run. D19, D29 to D32, T15, T28 to T31, M12, M22,
M05, M35, M17, M31 and M32 give the same results as before M33. The frame
has no `exceptions.json`.

## Checks

- Text: pass. Every Figma string is in the render and visible where
  Figma shows it; no extra text and no covered text.
- Position: 21 of 24 layers pass: `back row`, `button · map`,
  `meta row`, `kind badge`, `493:6286` (the title skill-eval-round),
  `path badge`, `links header`, `links graph`, `row · in and out`,
  `panel · linked from`, `panel · links to`, all four link rows
  (`link · skill-eval-cases · workflows/skill-eval-cases.md:5` to
  `link · eval-grader · skill-eval-round.md:46`), `tab bar` and its five
  items. The 3 that fail (`button · Discuss`, `toolkit`, `links`) are
  listed below.
- Rules: fail. Three `hiddenOverflow` findings: the item's ScrollFrame
  body (`div.scroll-frame__body`), the item tabs' list
  (`div.item-tabs__list`) and the Linked from panel's body
  (`[data-figma="panel · linked from"] > section.panel__root > div.panel__body`);
  see Under the tab bar, Item tabs and Long file and line.

## Deviations

- **Graph lines.** Figma draws a curve from the foot of each item over
  skill-eval-round down into its top, and from its foot down into each
  item under it. The render draws no lines: `MapGraph` draws each line
  from one node's side to another's, so on the upright graph its lines
  would cross the nodes (gap: Links graph (phone)).
- **Open workflow.** skill-eval-round in the middle of the graph is
  162 × 32 with a plain border in the workflow's colour and its name in
  mono, against Figma's 150 × 40 with an accent ring, a selected fill and
  its name in the label style. With no lines a selected node would dim
  every other node, so nothing is selected; skill-eval-round is centred
  where Figma centres it (gap: Links graph (phone), Links graph).
- **Node borders.** Each item of the graph and of the link rows has a
  border in the full colour of its kind; Figma draws the same colour at
  about 60 % alpha in the graph and 45 % in the rows, so its borders look
  muted (gap: Links graph, Links panel rows).
- **Link nodes.** The item at the start of each link row is a `MapNode`
  28 px high against Figma's 29 and 7 px wider, and the file and line at
  the row's end is a plain mono button in the accent colour (gap: Links
  panel rows). Every row passes the position check.
- **Long file and line.** `workflows/skill-eval-cases.md:5` (493:6653)
  does not fit beside its node: Figma runs it past the panel and the
  frame (it ends at x 425). The render keeps it on one line, so the
  library `Panel`'s body scrolls sideways; the rule check reports it as
  `hiddenOverflow`. Wrapping it would push every row under it lower than
  Figma's.
- **Tab height.** The tab is 6 px shorter than Figma's (`links` h -6):
  its lines of small text are 16 high on the 4 px grid (d-090) against
  Figma's 17. It lies under the tab bar.
- **Under the tab bar.** Figma draws the item down to the note's end,
  past the tab bar at y 767. The tab bar lies over the page (AppShell
  `tabBarOverlay`), so the Links to panel and the note lie under the bar
  in the render too, and the item's ScrollFrame body scrolls: the first
  `hiddenOverflow` finding, the scroll that Figma's own layout causes.
- **Item tabs.** As on M17: Evals ends inside the screen and only
  Activity runs past it, as in Figma; the list's sideways scroll is the
  second `hiddenOverflow` finding. The outline stays `border.selected` at
  half alpha (d-050).
- **Discuss button.** As on M21: an icon-only `Button` is square, so
  Discuss is `sm`, 28 × 28, against Figma's 36 × 28, and starts 8 px
  further right (`button · Discuss` x +8, w -8; gap: Item action
  buttons).
- **Item frame.** Figma's `toolkit` (493:6265) holds the back row and the
  item, from y 42 down. In `DetailFrame` the back row is the
  ScrollFrame's header and the item is the body under it, so the article
  starts under the back row and runs to the tab's end (`toolkit` y +36,
  h +199), as on M21 (d-107).
- **Path badge.** The copy icon is the badge's bare `icon/copy` (gap:
  Path badge copy button). The badge passes the position check.
