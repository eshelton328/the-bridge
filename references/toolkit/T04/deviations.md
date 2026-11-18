# T04 deviations

What still differs from Figma after the fidelity loop
(`pnpm fidelity toolkit T04`, 2026-11-18, against library 1.0.0-beta.28),
each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/skillFilesTablet.ts`: D06's files
(`skillFiles`) with only references/ open, doc.md first and selected, each
file's count in lines and the browser's `badge` (skills/writer/, 11 files).
On a tablet the item replaces the list in the shared `DetailFrame`
(d-107), as T03's does. The Files tab has no kind badge; the title and the
path row sit 8 apart over the tabs; the tree and the viewer are two boxes,
the viewer under the tree, with no copy button in its bar; doc.md opens
rendered, with the Rendered and Source switch under its text. D06, D10,
D33 to D36, T07, T10 and T19 give the same results as before T04.

## Checks

- Text: pass (49 strings checked). Nothing lies under the tab bar.
- Position: 12 of 20 layers pass (`back row`, `button · Show on map`,
  `title`, `path row`, `path badge`, `tab bar` and the six tabs of the
  navigation). The 8 that fail (`button · Discuss`, `toolkit item`,
  `434:406`, `tree`, `viewer`, `viewer bar`, `rendered markdown`,
  `view toggle`) are listed below.
- Rules: pass.

## Deviations

- **Tree rows.** Figma puts each role line beside the name (When to use,
  steps, rules. … beside SKILL.md; Read on demand beside references/), so
  every row is one line, 31 or 33 high. `FileTree` puts the caption under
  the name, so SKILL.md, references/, scripts/ and evals/ are two lines
  each, and an open folder's files sit 17 px further right. The tree is
  34 px taller (`tree` h +34), so the viewer and all of it starts 33 px
  lower (`viewer` y +33, `viewer bar` y +33, `rendered markdown` y +33,
  `view toggle` y +34). Gap: File tree rows.
- **Rendered and Source switch.** `ViewSwitch` draws its labels in the
  `label` text style, where Figma's are small, so the switch is 15 px
  wider (`view toggle` w +15.4) and its labels larger. Gap: Rendered and
  Source switch.
- **Boxes.** The tree and the viewer start 2 px further in and are 4 px
  narrower (`tree` x +2 w -4, `viewer` x +2 w -4): the Container pads 24
  at the sides against Figma's 22. The viewer is 12 under the tree
  against 14, and the rendered text is 16 in against 18 (no space token
  has 14 or 18). Gaps: Tablet item spacing, File browser.
- **Item frame.** Figma's `toolkit item` (434:188) holds the back row and
  the item, from y 41 to the tab bar. In `DetailFrame` the back row is the
  ScrollFrame's header and the item is the body under it, so the article
  starts under the back row and is as high as its content (`toolkit item`
  y +32, h -321, x +2, w -4). This is the d-107 structure that keeps Back
  in view. Gap: Tablet item spacing.
- **Title.** writer is 79.5 by 40 against Figma's 74 and 38 (`434:406`
  w +5.5, y -2): the `heading` glyphs and line height, as on T03
  (d-090). It starts 16 under the 32 px back row against Figma's 14
  under 36, so it sits 2 px higher and its centre within a pixel of
  Figma's; the tabs are 16 under the path row against 14 (no space
  token has 14), so the tree and all under it keep their place. Gap:
  Tablet item spacing.
- **Back row.** The back row is 32 px high against Figma's 36. Discuss is
  99.5 px wide against 97, so it starts 5 px further left
  (`button · Discuss` x -5.1, h -2). Gap: Item action buttons.
- **Item tabs.** The selected tab's outline is `border.selected` at half
  alpha where Figma's is solid cyan (no solid selected token, d-050).

## Second review

The blind review of the side-by-side (2026-11-18) found three
differences.

- **Title under the back row (fixed).** The title sat 20 under the back
  row, the space T03 keeps for its kind badge, which the Files tab leaves
  out; the back row's centre to the title's centre was 56 px against
  Figma's 51. The title now starts 16 under the back row (`filesPage` in
  `ToolkitItem.tsx`), 52 px from centre to centre, and
  `ToolkitFiles.test.tsx` checks the 16. The tree and the viewer stay
  where they were (`tree` y +1, `viewer` y +33).
- **File line counts.** The files' counts (56 lines, 68 lines under
  references/) end at the row's right edge, in line with the folders'
  counts (6, 4, 5 cases); Figma ends them 37 px further left (680
  against 717). `FileTree` puts every count at the row's end and has no
  prop for it. Gap: File tree rows.
- **File row spacing.** The file rows under references/ are 28 px apart
  against Figma's 31. `FileTree` sets the row height. Gap: File tree
  rows.
