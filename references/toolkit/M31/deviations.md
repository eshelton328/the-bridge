# M31 deviations

What still differs from Figma after the first run of the fidelity loop
(`pnpm fidelity toolkit M31`, 2026-11-18, against the installed library
1.0.0-beta.36), each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/ruleLinksPhone.ts`: T28's data
(`ruleLinksTablet`, D29's links). Its `links` does not set `named`, so on
the phone the rule keeps M19's header in the shared `DetailFrame` (d-107):
Back to Toolkit with the icon buttons, the kind badge with when it
changed, the name and the path badge. The graph stands upright
(`linksGraph`'s `phone` size, as on M17) with the reason where the side
over the rule would have its first row, and the two panels stand one
under the other. D19, D29 to D32, T15, T28 to T31, M12, M22, M05, M35
and M17 give the same results as before M31. The frame's `exceptions.json`
excepts the `hiddenOverflow` findings below, each with the entry that
records it; with them the text and rules checks now pass.

The last fidelity run (`pnpm fidelity toolkit`, every Toolkit frame,
2026-11-18) used the installed library 1.0.0-beta.42, with the graph's
open item 150 × 40 at Figma's place and, on the phone, the open item's
lines drawn upright and the open item selected. Text passes, 18 of 21
position layers pass and the rules fail. Against the same run on main
(24fc7be), the position and rule results, failing keys and findings are
the same.

## Checks

- Text: pass. Every Figma string is in the render and visible where
  Figma shows it; no extra text and no covered text.
- Position: 18 of 21 layers pass: `back row`, `button · map`,
  `meta row`, `kind badge`, `493:5375` (the title skills), `path badge`,
  `links header`, `links graph`, `row · in and out`,
  `panel · linked from`, `panel · links to`,
  `link · eval-cases · skills.md:72`, `tab bar` and its five items. The
  3 that fail (`button · Discuss`, `toolkit`, `links`) are listed below.
- Rules: fail. Two `hiddenOverflow` findings: the item's ScrollFrame body
  (`div.scroll-frame__body`) and the item tabs' list
  (`div.item-tabs__list`); see Under the tab bar and Item tabs.

## Deviations

- **Graph line.** The render draws the open item's lines upright
  (`MapGraph orientation="vertical"`, library beta.39 #148), all lit, as
  the open item is selected. Figma draws each line as its own curve from
  the foot of an item over skills down into its top, and from its foot
  down into each item under it. The library runs the lines down a lane
  between or beside the columns, behind skills, and meets each item at
  the side that faces the lane, so the lines do not fan into skills's
  top and foot (gap: Links graph (phone)).
- **Open rule.** skills in the middle of the graph is 150 × 40 with its
  name in the label style, selected (the accent ring and the selected
  fill), at Figma's place. Its icon is 16 px against Figma's 15 and sits
  8 from the name against Figma's 6: `MapNode` takes no icon size or gap
  (gap: Links graph).
- **Node borders.** Since library beta.39 (#151) each item of the graph
  has its kind's colour at 60 % alpha (`MapGraph nodeTone="muted"`) and
  each link row's node at 45 % (`MapNode tone="faint"`), with the icons
  in the full kind colour, as in Figma. The open item is selected,
  so it has the accent border, as in Figma. The icons are 16 px
  against Figma's 13 (gap: Links graph, Links panel rows).
- **Link node.** eval-cases in the Links to panel is a `MapNode` 28 px
  high against Figma's 29, and its file and line is a plain mono button
  in the accent colour (gap: Links panel rows). The row passes the
  position check.
- **Tab height.** The tab is 7 px shorter than Figma's (`links` h -7):
  its lines of small and mono text are 16 high on the 4 px grid (d-090)
  against Figma's 17, and the reason's two lines and the panels' text
  add up.
- **Under the tab bar.** Figma draws the item down to the note's end,
  past the tab bar at y 767. The tab bar lies over the page (AppShell
  `tabBarOverlay`), so the Links to panel and the note lie under the bar
  in the render too, and the item's ScrollFrame body scrolls: the first
  `hiddenOverflow` finding, the scroll that Figma's own layout causes.
  Since library beta.36 (#139) the tab bar is opaque, so what lies
  under it no longer shows through; the position and rule results
  did not change.
- **Item tabs.** As on M17: Evals ends inside the screen and only
  Activity runs past it, as in Figma; the list's sideways scroll is the
  second `hiddenOverflow` finding. The outline stays `border.selected` at
  half alpha (d-050).
- **Discuss button.** As on M19: an icon-only `Button` is square, so
  Discuss is `sm`, 28 × 28, against Figma's 36 × 28, and starts 8 px
  further right (`button · Discuss` x +8, w -8; gap: Item action
  buttons).
- **Item frame.** Figma's `toolkit` (493:5355) holds the back row and the
  item, from y 42 down. In `DetailFrame` the back row is the
  ScrollFrame's header and the item is the body under it, so the article
  starts under the back row and runs to the tab's end (`toolkit` y +36,
  h +49), as on M19 (d-107).
- **Path badge.** The copy icon is the badge's bare `icon/copy` (gap:
  Path badge copy button). The badge passes the position check.
- **Links graph icons.** Figma's side node icons are 13 px (500:10974);
  MapGraph `nodeIconSize="12"`
  (library #265) draws them at 12, within the icon check's 2 px, and the
  open item keeps its icon at 16 (its node's `iconSize`).
