# T32 deviations

What still differs from Figma after the fidelity loop
(`pnpm fidelity toolkit T32`, 2026-11-18, against library 1.0.0-beta.28),
each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/ruleFilesTablet.ts`: D33's list and rule
(`ruleFiles`) with the tablet's tree (one row, skills.md, whose role line
ends with its length) and the rule rendered in the viewer (its title and
first paragraph), with no line on when it loads. On a tablet the item
replaces the list in the shared `DetailFrame` (d-107), as T17's does, and
keeps T17's header: the kind badge, the name and the path row. The tree and
the viewer are two boxes, the viewer under the tree, as on T04. D06, D10,
D33 to D36, T04, T06, T07 and T19 give the same results as before T32.

## Checks

- Text: pass (29 strings checked). Nothing lies under the tab bar.
- Position: 13 of 21 layers pass (`back row`, `button · Show on map`,
  `meta row`, `kind badge`, `path row`, `path badge`, `tab bar` and the six
  tabs of the navigation). The 8 that fail (`button · Discuss`,
  `toolkit item`, `494:2870`, `tree`, `viewer`, `viewer bar`,
  `rendered markdown`, `view toggle`) are listed below.
- Rules: pass.

## Deviations

- **Tree row.** Figma puts the role line beside skills.md, so the row is
  one line, 33 high, with no selection outline. `FileTree` puts the caption
  under the name and outlines the selected row (skills.md is the file in
  the viewer), so the row is two lines in a cyan box and the tree is 21 px
  taller (`tree` h +21). The viewer and all of it starts 15 px lower
  (`viewer` y +15, `viewer bar` y +15, `rendered markdown` y +15,
  `view toggle` y +16). Gap: File tree rows.
- **Rendered and Source switch.** `ViewSwitch` draws its labels in the
  `label` text style, where Figma's are small, so the switch is 15 px
  wider (`view toggle` w +15.4) and its labels larger. Gap: Rendered and
  Source switch.
- **Boxes.** The tree and the viewer start 2 px further in and are 4 px
  narrower: the Container pads 24 at the sides against Figma's 22. The
  viewer is 12 under the tree against 14, and the rendered text is 16 in
  against 18 (no space token has 14 or 18). Gaps: Tablet item spacing,
  File browser.
- **Item frame.** Figma's `toolkit item` (494:2846) holds the back row and
  the item, from y 41 to the tab bar. In `DetailFrame` the back row is the
  ScrollFrame's header and the item is the body under it, so the article
  starts under the back row and is as high as its content (`toolkit item`
  y +32, h -601, x +2, w -4). This is the d-107 structure that keeps Back
  in view. Gap: Tablet item spacing.
- **Title.** skills is 70.4 px wide against Figma's 66 (`494:2870`
  w +4.4): the `heading` glyphs and line height, as on T17 (d-090).
- **Back row.** The back row is 32 px high against Figma's 36. Discuss is
  99.5 px wide against 97, so it starts 5 px further left
  (`button · Discuss` x -5.1, h -2). Gap: Item action buttons.
- **Item tabs.** The selected tab's outline is `border.selected` at half
  alpha where Figma's is solid cyan (no solid selected token, d-050).
