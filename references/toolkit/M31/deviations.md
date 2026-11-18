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
and M17 give the same results as before M31. The frame has no
`exceptions.json`.

The last fidelity run (`pnpm fidelity toolkit`, every Toolkit frame,
2026-11-18) used the installed library 1.0.0-beta.39 (#148, #151).
Text passes, 18 of 21 position layers pass and the rules fail: the
same results, failing keys and findings as the run on beta.39 before
this change, so the checks below still hold.

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

- **Graph line.** Figma draws a curve from the foot of skills down into
  the top of eval-cases. The render draws no lines. Library beta.39
  (#148) draws upright lines (`MapGraph orientation="vertical"`), but
  `linksView.test.ts` asserts that the phone graph has no edges and
  selects nothing, and `ToolkitLinks.test.tsx` that no node of M17's
  graph is pressed; a change to those lines waits for Erik (gap: Links
  graph (phone)).
- **Open rule.** skills in the middle of the graph is 162 × 32 with a
  plain border in the rule's colour and its name in mono, against Figma's
  150 × 40 with an accent ring, a selected fill and its name in the label
  style. With no lines a selected node would dim the other node, so
  nothing is selected; skills is centred where Figma centres it (gap:
  Links graph (phone), Links graph).
- **Node borders.** Since library beta.39 (#151) each item of the graph
  has its kind's colour at 60 % alpha (`MapGraph nodeTone="muted"`) and
  each link row's node at 45 % (`MapNode tone="faint"`), with the icons
  in the full kind colour, as in Figma. With nothing selected on the
  phone, the open item has the muted border too. The icons are 16 px
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
