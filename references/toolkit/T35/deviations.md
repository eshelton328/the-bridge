# T35 deviations

What still differs from Figma after the fidelity loop
(`pnpm fidelity toolkit T35`, 2026-11-18, against library 1.0.0-beta.28),
each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/hookFilesTablet.ts`: D36's list and hook
(`hookFiles`) with the tablet's tree (two script rows, each role line
ending with the file's length, the tests selected) and the tests summed up
in the viewer (their name and one paragraph, a view with `summary`, so no
Rendered and Source switch), with no line on their last run. On a tablet
the item replaces the list in the shared `DetailFrame` (d-107) and keeps
T19's header: the kind badge, the name and the path row. The tree and the
viewer are two boxes, the viewer under the tree, as on T04 and T32. D06,
D10, D33 to D36, T04, T06, T07 and T19 give the same results as before T35.

## Checks

- Text: pass (29 strings checked). Nothing lies under the tab bar.
- Position: 13 of 20 layers pass (`back row`, `button · Show on map`,
  `meta row`, `kind badge`, `path row`, `path badge`, `tab bar` and the six
  tabs of the navigation). The 7 that fail (`button · Discuss`,
  `toolkit item`, `494:4073`, `tree`, `viewer`, `viewer bar`,
  `rendered markdown`) are listed below.
- Rules: pass.

## Deviations

- **Tree rows.** Figma puts each role line beside its name, so each row is
  one line, 33 high; the code icons are cyan and the tests, the file in the
  viewer, have no selection outline. `FileTree` puts the captions under the
  names, draws the icons muted and outlines the selected row, so the rows
  are two lines, the tests in a cyan box, and the tree is 32 px taller
  (`tree` h +32). The viewer and all of it starts 26 px lower (`viewer`
  y +26, `viewer bar` y +26, `rendered markdown` y +26). Gap: File tree
  rows.
- **Viewer bar icon.** Figma starts the tests' bar with the file icon
  (494:4328); the viewer draws the code icon of a script, as the tree
  does. Gap: File browser.
- **Paragraph wrap.** Figma breaks the paragraph inside the path, after
  toolkit/rules/; the browser breaks only between words, so
  toolkit/rules/commits-and-prs.md starts the second line. Figma draws the
  ✗ as a slanted cross where the font draws an upright one.
- **Boxes.** The tree and the viewer start 2 px further in and are 4 px
  narrower: the Container pads 24 at the sides against Figma's 22. The
  viewer is 12 under the tree against 14, and the summary is 16 in
  against 18 (no space token has 14 or 18). Gaps: Tablet item spacing,
  File browser.
- **Item frame.** Figma's `toolkit item` (494:4049) holds the back row and
  the item, from y 41 to the tab bar. In `DetailFrame` the back row is the
  ScrollFrame's header and the item is the body under it, so the article
  starts under the back row and is as high as its content (`toolkit item`
  y +32, h -577, x +2, w -4). This is the d-107 structure that keeps Back
  in view. Gap: Tablet item spacing.
- **Title.** commit-msg is 168.7 px wide against Figma's 157 (`494:4073`
  w +11.7): the `heading` glyphs and line height, as on T19 (d-090).
- **Back row.** The back row is 32 px high against Figma's 36. Discuss is
  99.5 px wide against 97, so it starts 5 px further left
  (`button · Discuss` x -5.1, h -2). Gap: Item action buttons.
- **Item tabs.** The selected tab's outline is `border.selected` at half
  alpha where Figma's is solid cyan (no solid selected token, d-050).
