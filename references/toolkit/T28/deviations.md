# T28 deviations

What still differs from Figma after the fidelity loop
(`pnpm fidelity toolkit T28`, 2026-11-18, against library
1.0.0-beta.31), each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/ruleLinksTablet.ts`: D29's data
(`ruleLinks`). On a tablet the item replaces the list in the shared
`DetailFrame` (d-107) and keeps T17's header: Toolkit, the kind badge, the
name and the path row over the tabs. The graph is narrower and the two
panels stand one under the other. D19, D29 to D32, T03, T04, T07, T10,
T15, T17 and T19 give the same results as before T28. The frame has no
`exceptions.json`.

## Checks

- Text: pass. Every Figma string is in the render and visible, and
  nothing extra shows.
- Position: 19 of 23 layers pass: `back row`, `button · Show on map`,
  `meta row`, `kind badge`, `path row`, `path badge`, `links header`,
  `links graph`, `row · in and out`, both panels,
  `link · eval-cases · skills.md:72`, `tab bar` and its six tabs. The 4
  that fail (`button · Discuss`, `toolkit item`, `493:3270`, `links`) are
  listed below. The graph's nodes have no `data-figma`: `MapGraph` draws
  them, and it takes no attribute for a node.
- Rules: pass.

## Deviations

- **Item frame.** Figma's `toolkit item` (493:3246) holds the back row and
  the item, from y 41 down to the tab bar. In `DetailFrame` the back row
  is the ScrollFrame's header and the item is the body under it, so the
  article starts under the back row and ends with the tab's note
  (`toolkit item` y +32, h -398, x +2, w -4: the Container pads 24 at the
  sides against 22). This is the d-107 structure that keeps Back in view,
  as on T17 (gap: Tablet item spacing).
- **Back row.** The back row is 32 px high against Figma's 36 (gap: Item
  action buttons). Discuss is 99.5 px wide against 97, so it starts 5 px
  further left (`button · Discuss` x -5.1, h -2).
- **Title.** The name skills renders 70.4 px wide against 66
  (`493:3270` w +4.4), as on T17: the heading text style draws the word a
  little wider.
- **Line heights.** The tab is 5 px shorter than Figma's (`links` h -5).
  The links header, the panels' headers and lines and the note are 16 px
  high in the `monoCaps` and `small` text styles against Figma's 17: the
  library keeps line heights on the 4 px grid (d-072). Each row is within
  2 px of Figma's; only the tab's height adds them up.
- **Graph.** The open rule is 180 × 32 with its name in mono, where
  Figma's `node · skills (focus)` (493:3577) is 150 × 40 with its name in
  the label style, and the line ends in a 3 px dot (gap: Links graph). The
  reason stands in the left column as on D29.
- **Node borders.** Each item at a side of the graph and at the start of
  each link row has a border in the full colour of its kind (cyan for a
  skill, violet for an agent, amber for a rule, green for a workflow).
  Figma draws the same colour at about 60 % alpha in the graph and 45 %
  in the rows, so its borders look muted; the icons are full colour in
  both. `MapNode` has no state for a muted kind border and no token has
  a kind colour at part alpha (gap: Links graph, Links panel rows).
- **Panel rows.** The link's node is 28 high against 29 and its file and
  line is a plain button in mono (gap: Links panel rows).
- **Path badge.** The copy icon is the badge's bare `icon/copy`, as on
  T17 (gap: Path badge copy button).
- **Item tabs.** The selected tab's outline is `border.selected` at half
  alpha where Figma's is solid cyan (d-050).
