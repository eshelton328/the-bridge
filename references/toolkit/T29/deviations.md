# T29 deviations

What still differs from Figma after the fidelity loop
(`pnpm fidelity toolkit T29`, 2026-11-18, against library
1.0.0-beta.36), each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/agentLinksTablet.ts`: D30's data
(`agentLinks`) with `ui.from` set to the skill writer, as on T07. On a
tablet the item replaces the list in the shared `DetailFrame` (d-107)
under T07's breadcrumb (Toolkit › writer › writing-reviewer) and keeps
the agent's header: the kind badge, the name and the path row. The graph
is narrower and the two panels stand one under the other. D19, D29 to
D32, T03, T04, T07, T10, T15, T17, T19 and T28 give the same results as
before T29. The frame has no `exceptions.json`.

The last fidelity run (`pnpm fidelity toolkit`, every Toolkit frame,
2026-11-18) used the installed library 1.0.0-beta.39 (#148, #151).
Text passes, 24 of 30 position layers pass and the rules fail: the
same results, failing keys and findings as the run on beta.39 before
this change, so the checks below still hold.

## Checks

- Text: pass. Every Figma string in the frame is in the render and
  visible, and nothing extra shows.
- Position: the layers that pass include `back row`,
  `breadcrumb · Toolkit › writer › writing-reviewer`,
  `button · Show on map`, `meta row`, `kind badge`, `path row`,
  `path badge`, `links`, `links header`, `links graph`,
  `row · in and out`, both panels, the four Linked from rows, `tab bar`
  and its six tabs. The 6 that fail (`button · Discuss`, `toolkit item`,
  `493:3697`, `link · writer · writing-reviewer.md:30`,
  `link · writing · writing-reviewer.md:58`,
  `link · ste100 · writing-reviewer.md:102`) are listed below. The
  graph's nodes have no `data-figma`: `MapGraph` draws them, and it takes
  no attribute for a node.
- Rules: fail. One `hiddenOverflow` finding: the item's ScrollFrame body
  (`div.scroll-frame__body`), see Under the tab bar.

## Deviations

- **Under the tab bar.** Figma's Links tab ends at 1101, under the tab
  bar (`links` 493:3844), and its note is hidden there. The tab bar lies
  over the page (AppShell `tabBarOverlay`), and the rest of the item
  scrolls, so the rule check reports the scrolling body as
  `hiddenOverflow`, as on T10 and T15. It is not an exception.
  Since library beta.36 (#139) the tab bar is opaque, so what lies
  under it no longer shows through; the position and rule results
  did not change.
- **Item frame.** In `DetailFrame` the back row is the ScrollFrame's
  header and the item is the body under it, so the article starts under
  the back row (`toolkit item` y +32, h -18, x +2, w -4: the Container
  pads 24 at the sides against 22). This is the d-107 structure that
  keeps Back in view (gap: Tablet item spacing).
- **Links to rows.** The three rows of the Links to panel are 5 px higher
  than Figma's (`link · writer · writing-reviewer.md:30`,
  `link · writing · writing-reviewer.md:58`,
  `link · ste100 · writing-reviewer.md:102`, each y -5). The agent's
  header is 4 px shorter than Figma's, as on T07 and T33: the Agent
  badge is a tinted pill with no outline, shorter than Figma's 27 px
  outlined pill (gap: Kind badge outline), so the tabs start 4 px higher.
  The tab starts 2 px lower again under the tabs, and the links header
  and each panel header are 16 px high against 17 (the library keeps line
  heights on the 4 px grid, d-072). Every layer above the Links to panel
  is within 3 px of Figma's.
- **Back row.** Discuss is 99.5 px wide against 97, so it starts 5 px
  further left (`button · Discuss` x -5.1, h -2; gap: Item action
  buttons). The breadcrumb is `ToolkitItemBack`'s, as on T07: the first
  `›` sits about 12 px after Toolkit against Figma's 6 (gap: Item
  breadcrumb).
- **Title.** The name writing-reviewer renders 220.7 px wide against 206
  (`493:3697` w +14.7), as on T07: the heading text style draws the name
  wider.
- **Graph.** The open agent has its name in the label style, as Figma's,
  and the lines end at the node's edge with no dot, since library
  beta.39 (#151). It is 180 × 32, where Figma's `node · writing-reviewer
  (focus)` (493:4042) is 150 × 40 with a 15 px icon: beta.39 gives a
  node its own `size`, but four tests of `linksView.test.ts` assert the
  open item at 180 × 32, and a change to those lines waits for Erik
  (gap: Links graph).
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
