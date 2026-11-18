# T30 deviations

What still differs from Figma after the fidelity loop
(`pnpm fidelity toolkit T30`, 2026-11-18, against library
1.0.0-beta.36), each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/workflowLinksTablet.ts`: D31's data
(`workflowLinks`). On a tablet the item replaces the list in the shared
`DetailFrame` (d-107) and keeps T18's header: Toolkit, the kind badge, the
name and the path row over the tabs. The graph is narrower and the two
panels stand one under the other. D19, D29 to D32, T03, T04, T07, T10,
T15, T17, T19, T28 and T29 give the same results as before T30. The frame
has no `exceptions.json`.

The last fidelity run (`pnpm fidelity toolkit`, every Toolkit frame,
2026-11-18) used the installed library 1.0.0-beta.42, with the graph's
open item 150 × 40 at Figma's place and, on the phone, the open item's
lines drawn upright and the open item selected. Text passes, 23 of 26
position layers pass and the rules pass. Against the same run on main
(24fc7be), the position and rule results, failing keys and findings are
the same.

## Checks

- Text: pass. Every Figma string is in the render and visible, and
  nothing extra shows.
- Position: 23 of 26 layers pass: `back row`, `button · Show on map`,
  `meta row`, `kind badge`, `path row`, `path badge`, `links`,
  `links header`, `links graph`, `row · in and out`, both panels, all
  four link rows, `tab bar` and its six tabs. The 3 that fail
  (`button · Discuss`, `toolkit item`, `493:4281`) are listed below. The
  graph's nodes have no `data-figma`: `MapGraph` draws them, and it takes
  no attribute for a node.
- Rules: pass.

## Deviations

- **Item frame.** Figma's `toolkit item` (493:4256) holds the back row and
  the item, from y 41 down to the tab bar. In `DetailFrame` the back row
  is the ScrollFrame's header and the item is the body under it, so the
  article starts under the back row and ends with the tab's note
  (`toolkit item` y +32, h -248, x +2, w -4: the Container pads 24 at the
  sides against 22). This is the d-107 structure that keeps Back in view,
  as on T18 (gap: Tablet item spacing).
- **Back row.** The back row is 32 px high against Figma's 36 (gap: Item
  action buttons). Discuss is 99.5 px wide against 97, so it starts 5 px
  further left (`button · Discuss` x -5.1, h -2).
- **Title.** The name skill-eval-round renders 14.7 px wider than Figma's
  (`493:4281` w +14.7), as on T18 and T34: the `heading` glyphs.
- **Graph.** The open workflow is 150 × 40 with its name in the label
  style, as Figma's `node · skill-eval-round (focus)` (493:4698), and
  the lines end at the node's edge with no dot (library beta.39, #151).
  Its icon is 16 px against Figma's 15 and sits 8 from the name against
  Figma's 6: `MapNode` takes no icon size or gap (gap: Links graph).
- **Node borders.** Since library beta.39 (#151) each item at a side of
  the graph has its kind's colour at 60 % alpha (`MapGraph
  nodeTone="muted"`, `kindBorder.*`) and each link row's node at 45 %
  (`MapNode tone="faint"`, `kindBorderFaint.*`), with the icons in the
  full kind colour, as in Figma. The icons are 16 px against Figma's 13:
  `MapNode` takes no icon size (gap: Links graph, Links panel rows).
- **Panel rows.** Each link's node is 28 high against 29 and its file and
  line is a plain button in mono (gap: Links panel rows).
- **Path badge.** The copy icon is the badge's bare `icon/copy` (gap:
  Path badge copy button).
- **Item tabs.** The selected tab's outline is `border.selected` at half
  alpha where Figma's is solid cyan (d-050).
