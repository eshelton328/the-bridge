# M32 deviations

What still differs from Figma after the first run of the fidelity loop
(`pnpm fidelity toolkit M32`, 2026-11-18, against the installed library
1.0.0-beta.36), each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/agentLinksPhone.ts`: T29's data
(`agentLinksTablet`, D30's links) with no `ui.from`, as on M20. On the
phone the agent keeps its header in the shared `DetailFrame` (d-107):
Back to Toolkit with the icon buttons, the kind badge with when it
changed, the name and the path badge. The graph stands upright
(`linksGraph`'s `phone` size, as on M17): the skill writer and the agent
writer side by side on its first row, each its own node, and the two
panels stand one under the other. D19, D29 to D32, T15, T28 to T31, M12,
M22, M05, M35, M17 and M31 give the same results as before M32. The
frame's `exceptions.json` excepts the `hiddenOverflow` findings below,
each with the entry that records it; with them the text and rules checks
now pass.

The last fidelity run (`pnpm fidelity toolkit`, every Toolkit frame,
2026-11-18) used the installed library 1.0.0-beta.42, with the graph's
open item 150 × 40 at Figma's place and, on the phone, the open item's
lines drawn upright and the open item selected. Text passes, 24 of 27
position layers pass and the rules fail. Against the same run on main
(24fc7be), the position and rule results, failing keys and findings are
the same.

## Checks

- Text: pass. Every Figma string is in the render and visible where
  Figma shows it; no extra text and no covered text.
- Position: 24 of 27 layers pass: `back row`, `button · map`,
  `meta row`, `kind badge`, `493:5750` (the title writing-reviewer),
  `path badge`, `links header`, `links graph`, `row · in and out`,
  `panel · linked from`, `panel · links to`, all seven link rows
  (`link · writer · skills/writer/SKILL.md:107` to
  `link · ste100 · writing-reviewer.md:102`), `tab bar` and its five
  items. The 3 that fail (`button · Discuss`, `toolkit`, `links`) are
  listed below.
- Rules: fail. Two `hiddenOverflow` findings: the item's ScrollFrame body
  (`div.scroll-frame__body`) and the item tabs' list
  (`div.item-tabs__list`); see Under the tab bar and Item tabs.

## Deviations

- **Graph lines.** The render draws the open item's lines upright
  (`MapGraph orientation="vertical"`, library beta.39 #148), all lit, as
  the open item is selected. Figma draws each line as its own curve from
  the foot of an item over writing-reviewer down into its top, and from
  its foot down into each item under it. The library runs the lines down
  a lane between or beside the columns, behind writing-reviewer, and
  meets each item at the side that faces the lane, so the lines do not
  fan into writing-reviewer's top and foot (gap: Links graph (phone)).
- **Open agent.** writing-reviewer in the middle of the graph has its
  name in the label style and is selected (the accent ring and the
  selected fill), centred where Figma centres its 150 × 40 node. Its
  icon is 16 px against Figma's 15 and sits 8 from the name against
  Figma's 6: `MapNode` takes no icon size or gap (gap: Links graph). The
  name would not fit at Figma's 150 px: Figma's `writing-reviewer` is
  108 px wide (493:6090), and the library's label style leaves a name
  104 px of the 150 (a 1 px border and 10 px padding at each side, the
  16 px icon and the 8 px gap, where Figma's 15 px icon and 6 px gap
  leave 108). The graph measures the name after render and once the
  fonts load and, as it is cut, draws writing-reviewer 162 × 40, as wide
  as the side items, centred on the same point (`widenFocus`), so the
  whole name shows (gap: Links graph).
- **Node borders.** Since library beta.39 (#151) each item of the graph
  has its kind's colour at 60 % alpha (`MapGraph nodeTone="muted"`) and
  each link row's node at 45 % (`MapNode tone="faint"`), with the icons
  in the full kind colour, as in Figma. The open item is selected,
  so it has the accent border, as in Figma. The icons are 16 px
  against Figma's 13 (gap: Links graph, Links panel rows).
- **Link nodes.** The item at the start of each link row is a `MapNode`
  28 px high against Figma's 29, and the file and line at the row's end
  is a plain mono button in the accent colour (gap: Links panel rows).
  Every row passes the position check.
- **Kind badge.** The Agent label is dimmer than Figma's, which is in the
  agent colour, as on M36 (gap: Kind badge outline). The badge passes the
  position check.
- **Tab height.** The tab is 7 px shorter than Figma's (`links` h -7):
  its lines of small text are 16 high on the 4 px grid (d-090) against
  Figma's 17. It lies under the tab bar.
- **Under the tab bar.** Figma draws the item down to the note's end,
  past the tab bar at y 767. The tab bar lies over the page (AppShell
  `tabBarOverlay`), so the panels and the note lie under the bar in the
  render too, and the item's ScrollFrame body scrolls: the first
  `hiddenOverflow` finding, the scroll that Figma's own layout causes.
  Since library beta.36 (#139) the tab bar is opaque, so what lies
  under it no longer shows through; the position and rule results
  did not change.
- **Item tabs.** As on M17: Evals ends inside the screen and only
  Activity runs past it, as in Figma; the list's sideways scroll is the
  second `hiddenOverflow` finding. The outline stays `border.selected` at
  half alpha (d-050).
- **Discuss button.** As on M20: an icon-only `Button` is square, so
  Discuss is `sm`, 28 × 28, against Figma's 36 × 28, and starts 8 px
  further right (`button · Discuss` x +8, w -8; gap: Item action
  buttons).
- **Item frame.** Figma's `toolkit` (493:5730) holds the back row and the
  item, from y 42 down. In `DetailFrame` the back row is the
  ScrollFrame's header and the item is the body under it, so the article
  starts under the back row and runs to the tab's end (`toolkit` y +36,
  h +465), as on M20 (d-107).
- **Path badge.** The copy icon is the badge's bare `icon/copy` (gap:
  Path badge copy button). The badge passes the position check.
- **Links graph icons.** Figma's side node icons are 13 px (500:11046);
  `MapNode` draws them at 16, and `nodeDensity="compact"` (12) would draw
  the open item's 15 px icon at 12 too, so the graph keeps 16 and
  `exceptions.json` names 500:11046 (gap: Links graph).
