# M37 deviations

What still differs from Figma after the fidelity loop
(`pnpm fidelity toolkit M37`, 2026-11-18, against library 1.0.0-beta.28),
each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/workflowFilesPhone.ts`: T34's files
(`workflowFilesTablet`) with the phone's role lines for the design doc
(its length and kind) and harness/ (Outside the toolkit). The workflow
keeps M21's header (the kind badge with when it changed, the name and the
path badge with its copy button); under the tabs the workflow's folder in
the toolkit and the tree with the doc and the harness/ folder open, no
viewer and no row marked (`src/app/ToolkitFiles.test.tsx`, the M35 to M38
cases). D06, D10, D33 to D36, T04, T06, T32 to T35, M22 and M12 give the
same results as before M37.

## Checks

- Text: pass (35 strings checked).
- Position: 13 of 16 layers pass (`back row`, `button · map`,
  `meta row`, `kind badge`, `494:5021`, `path badge`,
  `toolkit/workflows/`, `tab bar` and the five tabs of the navigation).
  The 3 that fail (`button · Discuss`, `toolkit`, `tree`) are listed
  below.
- Rules: fail. One `hiddenOverflow` finding: the item tabs' list
  (`[data-figma="toolkit"] > div.item-tabs__root > div.item-tabs__list`),
  see Item tabs.

## Deviations

- **Tree rows.** Figma draws the six harness scripts in the marked band,
  each with a cyan name and code icon and a chevron at its end, 37 apart,
  as T34 draws them in cyan boxes; harness/ is open but ends with a right
  chevron. `FileTree` marks no script (none is the file opened), puts a
  down chevron before the open folder, indents its scripts 16 px and
  draws them as plain rows 28 apart, so the tree box is 52 px shorter
  (`tree` h -52). Gap: File tree rows.
- **Discuss button.** Figma's Discuss is an icon button 36 × 28; an
  icon-only `Button` is square, so Discuss is `sm`, 28 × 28, and starts
  8 px further right (`button · Discuss` x +8 w -8), as on M21. Gap: Item
  action buttons.
- **Item frame.** Figma's `toolkit` holds the back row and the item, from
  y 42 to the tab bar. In `DetailFrame` the back row is the ScrollFrame's
  header and the item is the body under it, so the article starts under
  the back row and is as high as its content (`toolkit` y +36, h -235),
  as on M21 (d-107).
- **Item tabs.** Activity runs past the screen's edge as in Figma; the
  compact list scrolls sideways (`hiddenOverflow` on the item tabs'
  list), as on M21 and M22. The selected tab's outline is
  `border.selected` at half alpha (no solid selected token, d-050).
- **Copy icon.** The path badge's copy icon is a plain button with
  `CopyIcon`, as on M21. Gap: Path badge copy button.
