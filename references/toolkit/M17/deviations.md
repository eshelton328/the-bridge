# M17 deviations

What still differs from Figma after round 1 of the fidelity loop
(`pnpm fidelity toolkit M17`, 2026-11-18, against the installed library
1.0.0-beta.31), each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/skillLinksPhone.ts`: T15's data
(`skillLinksTablet`, D19's links with `named`). On the phone the item
replaces the list in the shared `DetailFrame` (d-107), as on M12: the back
row names the item (Toolkit › writer) with M12's icon buttons, the title
is in the `title` text style, and the kind badge and path rows are left
out. The graph stands upright (`linksGraph`'s `phone` size) and the two
panels stand one under the other, as on T15. D19, D29 to D32, T15, T28 to
T31, M12, M22, M05 and M35 give the same results as before M17. The frame
has no `exceptions.json`.

## Checks

- Text: pass. Every Figma string is in the render and visible where
  Figma shows it; no extra text and no covered text. The panels and the
  note lie under the tab bar in both, as the tab bar lies over the page.
- Position: 25 of 28 layers pass: `back row`, `button · map`, `482:1067`
  (the title writer), `links header`, `links graph`, `row · in and out`,
  `panel · linked from`, `panel · links to`, all eleven link rows
  (`link · writing · rules/writing.md:77` to
  `link · audit-slop · SKILL.md:118`), `tab bar` and its five items. The
  3 that fail (`button · Discuss`, `toolkit`, `links`) are listed below.
- Rules: fail. Three `hiddenOverflow` findings: the item's ScrollFrame
  body (`div.scroll-frame__body`), the item tabs' list
  (`div.item-tabs__list`) and the Linked from panel's body
  (`[data-figma="panel · linked from"] > section.panel__root > div.panel__body`);
  see Under the tab bar, Item tabs and Long file and line.

## Deviations

- **Graph lines.** Figma draws a curve from the foot of each item over
  writer down into writer's top, and from writer's foot down into each
  item under it. The render draws no lines: `MapGraph` draws each line
  from one node's side to another's, so on the upright graph its lines
  would cross the nodes and run past the graph's right edge (gap: Links
  graph (phone)).
- **Open item.** writer in the middle of the graph is 162 × 32 with a
  plain border in the skill's colour and its name in mono, as the other
  items are, against Figma's 150 × 40 with an accent ring, a selected
  fill and its name in the label style. With no lines a selected node
  would dim every other node, so nothing is selected; writer is centred
  where Figma centres it (gap: Links graph (phone), Links graph).
- **Node borders.** Each item of the graph and of the link rows has a
  border in the full colour of its kind; Figma draws the same colour at
  about 60 % alpha in the graph and 45 % in the rows, so its borders look
  muted (gap: Links graph, Links panel rows).
- **Link nodes.** The item at the start of each link row is a `MapNode`
  28 px high against Figma's 29, and the file and line at the row's end
  is a plain mono button in the accent colour (gap: Links panel rows).
  Every row passes the position check.
- **Long file and line.** `agents/writing-reviewer.md:30` (482:1281)
  does not fit beside its node in the 332 px row: Figma runs it past the
  panel's edge and the frame's (it ends at x 410). The render keeps it on
  one line, so the library `Panel`'s body scrolls sideways by 46 px; the
  rule check reports it as `hiddenOverflow`. The text is not cut short,
  as an ellipsis would hide its end, and wrapping it would push every
  row under it 21 px lower than Figma's.
- **Tab height.** The tab is 6 px shorter than Figma's (`links` h -6):
  the note under the panels (482:1356) is two lines of the `small` text
  style, 16 high each on the 4 px grid (d-090), against Figma's 17. It
  lies under the tab bar.
- **Under the tab bar.** Figma draws the item down to the note's end
  (y 1471), past the tab bar at y 767. The tab bar lies over the page
  (AppShell `tabBarOverlay`), so the panels and the note lie under the bar
  in the render too, and the item's ScrollFrame body scrolls: the first
  `hiddenOverflow` finding. This is the scroll that Figma's own layout
  causes, as on M12.
- **Item tabs.** As on M12: `ItemTabs density="compact" tone="accent"`
  ends Evals inside the screen and only Activity runs past it, as in
  Figma; the list's sideways scroll is the second `hiddenOverflow`
  finding. The outline stays `border.selected` at half alpha (d-050).
- **Discuss button.** As on M12: an icon-only `Button` is square, so
  Discuss is `sm`, 28 × 28, against Figma's 36 × 28, and starts 6 px
  further right (`button · Discuss` x +6, w -8; gap: Item action
  buttons).
- **Item frame.** Figma's `toolkit` (482:1056) holds the back row and the
  item, from y 42 down. In `DetailFrame` the back row is the
  ScrollFrame's header and the item is the body under it, so the article
  starts under the back row and runs to the tab's end (`toolkit` y +36,
  h +663). This is the d-107 structure that keeps Back in view, as on M12.
- **Back row.** Toolkit and its chevron are `BackRow`'s: `labelLg` and an
  18 px chevron, where Figma has label text and 16 px (gap: Item
  breadcrumb). The row passes the position check.
