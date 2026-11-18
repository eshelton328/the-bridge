# T34 deviations

What still differs from Figma after the fidelity loop
(`pnpm fidelity toolkit T34`, 2026-11-18, against library 1.0.0-beta.28),
each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/workflowFilesTablet.ts`: D35's list and
workflow (`workflowFiles`) with the tablet's tree (the design doc, whose
role line ends with its length, and the harness/ folder open with its six
scripts, each count in lines) and the doc rendered in the viewer (its title
and first paragraph), with no line on what names the scripts. On a tablet
the item replaces the list in the shared `DetailFrame` (d-107) and keeps
T17's header: the kind badge, the name and the path row. The tree and the
viewer are two boxes, the viewer under the tree, as on T04 and T32. D06,
D10, D33 to D36, T04, T06, T07 and T19 give the same results as before T34.

## Checks

- Text: pass (44 strings checked). Nothing lies under the tab bar.
- Position: 17 of 21 layers pass (`back row`, `button · Show on map`,
  `meta row`, `kind badge`, `path row`, `path badge`, `tree`, `viewer`,
  `viewer bar`, `rendered markdown`, `tab bar` and the six tabs of the
  navigation). The 4 that fail (`button · Discuss`, `toolkit item`,
  `494:3571`, `view toggle`) are listed below.
- Rules: pass.

## Deviations

- **Tree rows.** Figma draws each of the six harness scripts in a cyan
  box with a cyan name, as a selected row is drawn, and leaves the doc,
  the file in the viewer, with no outline; its rows are 33 high, each role
  line beside its name. `FileTree` outlines only the selected row (the
  doc), so the doc is in a cyan box and the scripts are plain rows 28
  apart; the role lines of the doc and of harness/ sit under their names.
  The two differences cancel in height, so the tree and the viewer keep
  Figma's boxes within the tolerance. Gap: File tree rows.
- **Rendered and Source switch.** `ViewSwitch` draws its labels in the
  `label` text style, where Figma's are small, so the switch is 15 px
  wider (`view toggle` w +15.4) and its labels larger. Gap: Rendered and
  Source switch.
- **Boxes.** The tree and the viewer start 2 px further in and are 4 px
  narrower: the Container pads 24 at the sides against Figma's 22. The
  viewer is 12 under the tree against 14, and the rendered text is 16 in
  against 18 (no space token has 14 or 18). Gaps: Tablet item spacing,
  File browser.
- **Item frame.** Figma's `toolkit item` (494:3546) holds the back row and
  the item, from y 41 to the tab bar. In `DetailFrame` the back row is the
  ScrollFrame's header and the item is the body under it, so the article
  starts under the back row and is as high as its content (`toolkit item`
  y +32, h -369, x +2, w -4). This is the d-107 structure that keeps Back
  in view. Gap: Tablet item spacing.
- **Title.** skill-eval-round is 211.7 px wide against Figma's 197
  (`494:3571` w +14.7): the `heading` glyphs and line height, as on T18
  (d-090).
- **Back row.** The back row is 32 px high against Figma's 36. Discuss is
  99.5 px wide against 97, so it starts 5 px further left
  (`button · Discuss` x -5.1, h -2). Gap: Item action buttons.
- **Item tabs.** The selected tab's outline is `border.selected` at half
  alpha where Figma's is solid cyan (no solid selected token, d-050).

## Second review

The blind review of the side-by-side (2026-11-18) found one difference.

- **Harness script rows.** The six scripts under harness/ (run.sh to
  aggregate.py) start their icons and names about 19 px further right,
  past the folder's chevron, and their line counts end at the row's
  right edge, in line with the folder's count 6. In Figma the icons sit
  under the chevron (`icon/code` 494:3940 at 40, `icon/down` 494:3925 at
  39) and the counts (`156 lines` 494:3939) end at 680, 37 px left of
  the folder's count (494:3932, 717). `FileTree` indents a folder's files
  16 px past its chevron and puts every count at the row's end, with no
  prop for either. Gap: File tree rows.
