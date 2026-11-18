# T31 deviations

What still differs from Figma after the fidelity loop
(`pnpm fidelity toolkit T31`, 2026-11-18, against library
1.0.0-beta.36), each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/hookLinksTablet.ts`: D32's data
(`hookLinks`). On a tablet the item replaces the list in the shared
`DetailFrame` (d-107) and keeps T19's header: Toolkit, the kind badge, the
name and the path row over the tabs. The hook and the rule it enforces
name each other, so the rule stands on both sides of the graph. The graph
is narrower and the two panels stand one under the other. D19, D29 to
D32, T03, T04, T07, T10, T15, T17, T19 and T28 to T30 give the same
results as before T31. The frame has no `exceptions.json`.

## Checks

- Text: pass. Every Figma string is in the render and visible, and
  nothing extra shows.
- Position: 21 of 24 layers pass: `back row`, `button · Show on map`,
  `meta row`, `kind badge`, `path row`, `path badge`, `links`,
  `links header`, `links graph`, `row · in and out`, both panels, both
  link rows, `tab bar` and its six tabs. The 3 that fail
  (`button · Discuss`, `toolkit item`, `493:4892`) are listed below. The
  graph's nodes have no `data-figma`: `MapGraph` draws them, and it takes
  no attribute for a node.
- Rules: pass.

## Deviations

- **Item frame.** Figma's `toolkit item` (493:4868) holds the back row and
  the item, from y 41 down to the tab bar. In `DetailFrame` the back row
  is the ScrollFrame's header and the item is the body under it, so the
  article starts under the back row and ends with the tab's note
  (`toolkit item` y +32, h -364, x +2, w -4: the Container pads 24 at the
  sides against 22). This is the d-107 structure that keeps Back in view,
  as on T19 (gap: Tablet item spacing).
- **Back row.** The back row is 32 px high against Figma's 36 (gap: Item
  action buttons). Discuss is 99.5 px wide against 97, so it starts 5 px
  further left (`button · Discuss` x -5.1, h -2).
- **Title.** The name commit-msg renders 11.7 px wider than Figma's
  (`493:4892` w +11.7), as on T19: the `heading` glyphs.
- **Graph.** The open hook is 180 × 32 with its name in mono, where
  Figma's `node · commit-msg (focus)` is 150 × 40 with its name in the
  label style, and each line ends in a 3 px dot (gap: Links graph).
- **Node borders.** Each item at a side of the graph and at the start of
  each link row has a border in the full colour of its kind (cyan for a
  skill, violet for an agent, amber for a rule, green for a workflow).
  Figma draws the same colour at about 60 % alpha in the graph and 45 %
  in the rows, so its borders look muted; the icons are full colour in
  both. `MapNode` has no state for a muted kind border and no token has
  a kind colour at part alpha (gap: Links graph, Links panel rows).
- **Panel rows.** Each link's node is 28 high against 29 and its file and
  line is a plain button in mono (gap: Links panel rows).
- **Path badge.** The copy icon is the badge's bare `icon/copy` (gap:
  Path badge copy button).
- **Item tabs.** The selected tab's outline is `border.selected` at half
  alpha where Figma's is solid cyan (d-050).
