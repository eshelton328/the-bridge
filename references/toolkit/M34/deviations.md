# M34 deviations

What still differs from Figma after the first run of the fidelity loop
(`pnpm fidelity toolkit M34`, 2026-11-18, against the installed library
1.0.0-beta.36), each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/hookLinksPhone.ts`: T31's data
(`hookLinksTablet`, D32's links). On the phone the hook keeps its header
in the shared `DetailFrame` (d-107), as on M22: Back to Toolkit with the
icon buttons, the kind badge with when it changed, the name and the path
badge. The graph stands upright (`linksGraph`'s `phone` size, as on M17),
with the rule commits-and-prs over the hook and under it, and the two
panels stand one under the other. D19, D29 to D32, T15, T28 to T31, M12,
M22, M05, M35, M17, M31, M32 and M33 give the same results as before M34.
The frame's `exceptions.json` excepts the `hiddenOverflow` findings
below, each with the entry that records it; with them the text and rules
checks now pass.

The last fidelity run (`pnpm fidelity toolkit`, every Toolkit frame,
2026-11-18) used the installed library 1.0.0-beta.42, with the graph's
open item 150 × 40 at Figma's place and, on the phone, the open item's
lines drawn upright and the open item selected. Text passes, 19 of 22
position layers pass and the rules fail. Against the same run on main
(24fc7be), the position and rule results, failing keys and findings are
the same.

## Checks

- Text: pass. Every Figma string is in the render and visible where
  Figma shows it; no extra text and no covered text.
- Position: 19 of 22 layers pass: `back row`, `button · map`,
  `meta row`, `kind badge`, `493:6758` (the title commit-msg),
  `path badge`, `links header`, `links graph`, `row · in and out`,
  `panel · linked from`, `panel · links to`,
  `link · commits-and-prs · rules/commits-and-prs.md:182`,
  `link · commits-and-prs · commit-msg:3`, `tab bar` and its five items.
  The 3 that fail (`button · Discuss`, `toolkit`, `links`) are listed
  below.
- Rules: fail. Three `hiddenOverflow` findings: the item's ScrollFrame
  body (`div.scroll-frame__body`), the item tabs' list
  (`div.item-tabs__list`) and the Linked from panel's body
  (`[data-figma="panel · linked from"] > section.panel__root > div.panel__body`);
  see Under the tab bar, Item tabs and Long file and line.

## Deviations

- **Graph lines.** The render draws the open item's lines upright
  (`MapGraph orientation="vertical"`, library beta.39 #148), all lit, as
  the open item is selected. Figma draws each line as its own curve from
  the foot of an item over commit-msg down into its top, and from its
  foot down into each item under it. The library runs the lines down a
  lane between or beside the columns, behind commit-msg, and meets each
  item at the side that faces the lane, so the lines do not fan into
  commit-msg's top and foot (gap: Links graph (phone)).
- **Open hook.** commit-msg in the middle of the graph is 150 × 40 with
  its name in the label style, selected (the accent ring and the
  selected fill), at Figma's place. Its icon is 16 px against Figma's 15
  and sits 8 from the name against Figma's 6: `MapNode` takes no icon
  size or gap (gap: Links graph).
- **Node borders.** Since library beta.39 (#151) each item of the graph
  has its kind's colour at 60 % alpha (`MapGraph nodeTone="muted"`) and
  each link row's node at 45 % (`MapNode tone="faint"`), with the icons
  in the full kind colour, as in Figma. The open item is selected,
  so it has the accent border, as in Figma. The icons are 16 px
  against Figma's 13 (gap: Links graph, Links panel rows).
- **Link nodes.** The item at the start of each link row is a `MapNode`
  28 px high against Figma's 29 and a few px wider, and the file and line
  at the row's end is a plain mono button in the accent colour (gap:
  Links panel rows). Both rows pass the position check.
- **Long file and line.** `rules/commits-and-prs.md:182` (493:7153) does
  not fit beside its node: Figma runs it past the panel and the frame (it
  ends at x 395). The render keeps it on one line, so the library
  `Panel`'s body scrolls sideways; the rule check reports it as
  `hiddenOverflow`. Wrapping it would push every row under it lower than
  Figma's.
- **Intro line breaks.** The intro's first line ends with "file that"
  where Figma's ends with "file": the body text renders a little
  narrower. Both are three lines, and the text check passes.
- **Tab height.** The tab is 7 px shorter than Figma's (`links` h -7):
  its lines of small text are 16 high on the 4 px grid (d-090) against
  Figma's 17. It lies under the tab bar.
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
- **Discuss button.** As on M22: an icon-only `Button` is square, so
  Discuss is `sm`, 28 × 28, against Figma's 36 × 28, and starts 8 px
  further right (`button · Discuss` x +8, w -8; gap: Item action
  buttons).
- **Item frame.** Figma's `toolkit` (493:6738) holds the back row and the
  item, from y 42 down. In `DetailFrame` the back row is the
  ScrollFrame's header and the item is the body under it, so the article
  starts under the back row and runs to the tab's end (`toolkit` y +36,
  h +99), as on M22 (d-107).
- **Path badge.** The copy icon is the badge's bare `icon/copy` (gap:
  Path badge copy button). The badge passes the position check.
- **Links graph icons.** Figma's side node icons are 13 px (500:11171);
  `MapNode` draws them at 16, and `nodeDensity="compact"` (12) would draw
  the open item's 15 px icon at 12 too, so the graph keeps 16 and
  `exceptions.json` names 500:11171 (gap: Links graph).
