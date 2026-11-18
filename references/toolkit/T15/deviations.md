# T15 deviations

What still differs from Figma after the fidelity loop
(`pnpm fidelity toolkit T15`, 2026-11-18, against library
1.0.0-beta.36), each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/skillLinksTablet.ts`: D19's data
(`skillLinks`), with its `links` set `named`. On a tablet the item
replaces the list in the shared `DetailFrame` (d-107), as T10's does: the
back row names the item (Toolkit › writer), and the kind badge and path
rows are left out. The graph is narrower and the two panels stand one
under the other. D19, D29 to D32, T03, T04, T07, T10, T17 and T19 give the
same results as before T15. The frame has no `exceptions.json`.

The last fidelity run (`pnpm fidelity toolkit`, every Toolkit frame,
2026-11-18) used the installed library 1.0.0-beta.42, with the graph's
open item 150 × 40 at Figma's place and, on the phone, the open item's
lines drawn upright and the open item selected. Text passes, 27 of 29
position layers pass and the rules fail. Against the same run on main
(24fc7be), the position and rule results, failing keys and findings are
the same.

## Checks

- Text: pass. Every Figma string in the frame is in the render and
  visible, and nothing extra shows. The links under the tab bar
  (`a commit or PR: toolkit/rules/commits-and-prs.md`, 482:990) lie under
  the bar in both, as the bar lies over the page.
- Position: 27 of 29 layers pass: `back row`, `button · Show on map`,
  `482:735` (the title writer), `482:908` (the tab), `links header`,
  `links graph`, `row · in and out`, both panels, all eleven link rows,
  `tab bar` and its six tabs. The 2 that fail (`button · Discuss`,
  `toolkit item`) are listed below. The graph's nodes have no
  `data-figma`: `MapGraph` draws them, and it takes no attribute for a
  node.
- Rules: fail. One `hiddenOverflow` finding: the item's ScrollFrame body
  (`div.scroll-frame__body`), see Under the tab bar.

## Deviations

- **Under the tab bar.** Figma's Links tab runs past the tab bar and the
  frame's foot (`links` 482:908 ends at 1360). The tab bar lies over the
  page (AppShell `tabBarOverlay`): the DetailFrame body runs under the bar
  as Figma's item does, and the rest of the tab scrolls, so the rule check
  reports the scrolling body as `hiddenOverflow`. This is the scroll that
  Figma's own layout causes, as on T10. It is not an exception.
  Since library beta.36 (#139) the tab bar is opaque, so what lies
  under it no longer shows through; the position and rule results
  did not change.
- **Item frame.** Figma's `toolkit item` (482:723) holds the back row and
  the item, from y 41 to the tab bar. In `DetailFrame` the back row is the
  ScrollFrame's header and the item is the body under it, so the article
  starts under the back row and keeps the whole tab (`toolkit item` y +32,
  h +246, x +2, w -4: the Container pads 24 at the sides against 22). This
  is the d-107 structure that keeps Back in view (gap: Tablet item
  spacing).
- **Back row.** The back row is 32 px high against Figma's 36 (gap: Item
  action buttons). Discuss is 99.5 px wide against 97 and ends 2 px
  further in, so it starts 7 px further left (`button · Discuss` x -7.1,
  h -2). Toolkit and its chevron are `BackRow`'s: `labelLg` and an 18 px
  chevron, where Figma has label text and a 16 px chevron (gap: Item
  breadcrumb).
- **Graph.** The open item is 150 × 40 with its name in the label style,
  as Figma's `node · writer (focus)` (487:21), and the lines end at the
  node's edge with no dot (library beta.39, #151). Its icon is 16 px
  against Figma's 15 and sits 8 from the name against Figma's 6:
  `MapNode` takes no icon size or gap (gap: Links graph). The graph is
  708 wide against 712, as the Container pads 24, and 320 high against
  316: `linksGraph` keeps the desktop's places in height (the tallest
  column 46 down and 12 over the foot, as on T29), where T15's column
  starts 43 down and ends 11 over the foot. The tab starts 12 under the
  tabs, as Figma's, so the panels stay within 2 px of Figma's.
- **Node borders.** Since library beta.39 (#151) each item at a side of
  the graph has its kind's colour at 60 % alpha (`MapGraph
  nodeTone="muted"`, `kindBorder.*`) and each link row's node at 45 %
  (`MapNode tone="faint"`, `kindBorderFaint.*`), with the icons in the
  full kind colour, as in Figma. The icons are 16 px against Figma's 13:
  `MapNode` takes no icon size (gap: Links graph, Links panel rows).
- **Panel rows.** Each link's node is 28 high against 29 and its file and
  line is a plain button in mono (gap: Links panel rows); each row stays
  within 1 px of Figma's.
- **Item tabs.** As on T10: the selected tab's outline is
  `border.selected` at half alpha where Figma's is solid cyan (d-050).
- **Open item place.** writer is 150 × 40, as Figma's, and sits 9 px
  lower than Figma's (156 down inside the border against 147), level
  with the middle of the two columns, as on D19 and T29. T15 alone draws
  its columns 3 px higher and its open item about 6 px above their
  middle.
