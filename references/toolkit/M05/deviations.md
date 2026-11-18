# M05 deviations

What still differs from Figma after the fidelity loop
(`pnpm fidelity toolkit M05`, 2026-11-18, against library 1.0.0-beta.28),
each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/skillFilesPhone.ts`: T4's files
(`skillFilesTablet`) with the phone's shorter role lines (SKILL.md and
evals/), each script's count in lines, only scripts/ open and `ui.file` set
to check, the file opened last. On the phone the Files tab has no viewer:
the title sits over the tabs with no path row, the copy button joins
Discuss and Show on map in the back row, and the skill's folder in the
toolkit sits over the tree. A file with a view opens on a page of its own
(M06, M08; `src/app/ToolkitFiles.test.tsx`, the M5 case). D06, D10, D33 to
D36, T04, T06, T32 to T35, M22 and M12 give the same results as before
M05.

## Checks

- Text: pass (34 strings checked). Nothing lies under the tab bar.
- Position: 10 of 14 layers pass (`back row`, `button · map`, `435:210`,
  `toolkit/skills/writer/`, `tab bar` and the five tabs of the
  navigation). The 4 that fail (`button · copy`, `button · Discuss`,
  `toolkit`, `tree`) are listed below.
- Rules: fail. One `hiddenOverflow` finding: the item tabs' list
  (`[data-figma="toolkit"] > div.item-tabs__root > div.item-tabs__list`),
  see Item tabs.

## Deviations

- **Tree rows.** Figma draws the phone's tree as a list: every row ends
  with a 14 px chevron (right on a file and a closed folder, down on the
  open scripts/), a row with a role line is 54 high and a script row 37,
  a script's icon sits under the folder's icon with no indent, and the
  marked check is a full-width band with no outline. The library's
  `FileTree` puts a chevron before each folder and none on a file,
  indents scripts/'s files 16 px, draws its rows shorter and outlines the
  marked row, so the tree box is 54 px shorter (`tree` h -54). Gap: File
  tree rows.
- **Back row buttons.** Figma's Discuss is an icon button 36 × 28; an
  icon-only `Button` is square, so Discuss is `sm`, 28 × 28, and starts
  8 px further right (`button · Discuss` x +8 w -8). The copy button is
  8 before it, so it starts 8 px further right too (`button · copy`
  x +8). Show on map passes. Gap: Item action buttons.
- **Item frame.** Figma's `toolkit` (435:32) holds the back row and the
  item, from y 42 to the tab bar. In `DetailFrame` the back row is the
  ScrollFrame's header and the item is the body under it, so the article
  starts under the back row and is as high as its content (`toolkit`
  y +36, h -277). This is the d-107 structure that keeps Back in view, as
  on M02, M12 and M22.
- **Item tabs.** `ItemTabs density="compact"` draws the tabs as Figma
  does, and Activity runs past the screen's edge in both; the list
  scrolls sideways, which the rule check reports as `hiddenOverflow`, as
  on M12 and M22. The selected tab's outline is `border.selected` at half
  alpha where Figma's is solid cyan (no solid selected token, d-050).
- **Tree box.** The tree box is drawn with the Panel's tokens (border,
  radius, `surface.pane`), as on T04; the library has no file browser
  frame. Gap: File browser.
