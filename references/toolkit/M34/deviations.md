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
The frame has no `exceptions.json`.

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

- **Graph lines.** Figma draws a curve from the foot of commits-and-prs
  down into commit-msg's top, and from commit-msg's foot down into
  commits-and-prs under it. The render draws no lines: `MapGraph` draws
  each line from one node's side to another's, so on the upright graph
  its lines would cross the nodes (gap: Links graph (phone)).
- **Open hook.** commit-msg in the middle of the graph is 162 × 32 with a
  plain border in the hook's colour and its name in mono, against Figma's
  150 × 40 with an accent ring, a selected fill and its name in the label
  style. With no lines a selected node would dim the other nodes, so
  nothing is selected; commit-msg is centred where Figma centres it (gap:
  Links graph (phone), Links graph).
- **Node borders.** commits-and-prs in the graph and in the link rows has
  a border in the rule's full colour; Figma draws it at about 60 % alpha
  in the graph and 45 % in the rows, a muted tan (gap: Links graph, Links
  panel rows).
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
