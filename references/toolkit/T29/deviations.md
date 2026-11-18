# T29 deviations

What still differs from Figma after the fidelity loop
(`pnpm fidelity toolkit T29`, 2026-11-18, against library
1.0.0-beta.31), each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/agentLinksTablet.ts`: D30's data
(`agentLinks`) with `ui.from` set to the skill writer, as on T07. On a
tablet the item replaces the list in the shared `DetailFrame` (d-107)
under T07's breadcrumb (Toolkit › writer › writing-reviewer) and keeps
the agent's header: the kind badge, the name and the path row. The graph
is narrower and the two panels stand one under the other. D19, D29 to
D32, T03, T04, T07, T10, T15, T17, T19 and T28 give the same results as
before T29. The frame has no `exceptions.json`.

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
- **Graph.** The open agent is 180 × 32 with its name in mono, where
  Figma's `node · writing-reviewer (focus)` (493:4042) is 150 × 40 with
  its name in the label style, and each line ends in a 3 px dot (gap:
  Links graph).
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
