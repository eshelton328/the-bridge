# M06 deviations

What still differs from Figma after the fidelity loop
(`pnpm fidelity toolkit M06`, 2026-11-18, against library 1.0.0-beta.28),
each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/scriptCodePhone.ts`: M05's files
(`skillFilesPhone`) with check's view on the phone (its language, length
and role as the meta line, the source as Figma numbers its 17 lines, what
runs it, the line under the code and D10's explanation) and `ui.filePage`
on Code. On the phone every file with a view opens on a page of its own in
the shared `DetailFrame` (d-107): Back to Files with the copy button,
Discuss and Show on map, the path badge with the script's name, the tabs,
then `ToolkitFilePage layout="phone"`
(`src/app/ToolkitFiles.test.tsx`, the M6 case). D06, D10, D33 to D36, T04,
T06, T32 to T35, M22 and M12 give the same results as before M06.

One fix round: the first run named the switch's row `mode row`, as on
T06, and M06 has no such layer; the phone leaves the name out.

## Checks

- Text: pass. Every Figma string is in the render and visible, the 17 code
  lines included; nothing lies under the tab bar.
- Position: 10 of 15 layers pass (`back row`, `button · map`,
  `toggle · Explain | Code`, `read-only`, `tab bar` and the five tabs of
  the navigation). The 5 that fail (`button · copy`, `button · Discuss`,
  `toolkit`, `path badge`, `code`) are listed below.
- Rules: fail. One `hiddenOverflow` finding: the item tabs' list
  (`[data-figma="toolkit"] > div.item-tabs__root > div.item-tabs__list`),
  see Item tabs.

## Deviations

- **Code box.** Figma's source lines are 19 apart (17 high with 2
  between) and start 11 in and 13 down; `CodeLines` puts them 16 apart
  and pads 16, so the box is 9 px shorter (`code` h -9) and the text
  starts 5 px further in. No line-height token has 17 or 19 (d-050). The
  lines wrap as Figma's do and nothing scrolls sideways. Gap: File
  preview.
- **Path badge.** Figma's badge has a 16 px code icon 9 in and no copy
  icon; `PathBadge` sizes its icon slot for 12 px, so the badge is 6 px
  narrower (`path badge` w -6.4). Gap: Path badge copy button.
- **Back row buttons.** Figma's Discuss is an icon button 36 × 28; an
  icon-only `Button` is square, so Discuss is `sm`, 28 × 28, and starts
  8 px further right (`button · Discuss` x +8 w -8), and the copy button 8
  before it too (`button · copy` x +8). Show on map passes. Gap: Item
  action buttons.
- **Item frame.** Figma's `toolkit` (435:316) holds the back row and the
  page, from y 42 to the tab bar. In `DetailFrame` the back row is the
  ScrollFrame's header and the item is the body under it, so the article
  starts under the back row and is as high as its content (`toolkit`
  y +36, h -165), as on M05 and M22 (d-107).
- **Item tabs.** Activity runs past the screen's edge as in Figma; the
  compact list scrolls sideways (`hiddenOverflow` on the item tabs'
  list), as on M05, M12 and M22. The selected tab's outline is
  `border.selected` at half alpha (no solid selected token, d-050).
- **Explain and Code switch.** `ViewSwitch size="md"` is 32 high against
  34, within the position check. Gap: Explain and Code switch.
