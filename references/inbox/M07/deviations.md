# M07 deviations

What still differs from Figma M7 · Filter (the Filter sheet over the list, `filterList`), after the last
fidelity run (`pnpm fidelity inbox M07`, 2026-11-17, library
1.0.0-beta.4), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (84 strings checked).
- Position: 1 of 9 layers pass (`tab bar`).
- Rules: pass (1 findings under exceptions.json).

## Failing layers

Render minus Figma, in px; "38 px removed" is the y offset without the
status bar.

- `inbox list`: x +0, y -38, w +0, h +19; 38 px removed: y +0.
- `header`: x +0, y -38, w +0, h -4; 38 px removed: y +0.
- `filter · chips`: x +0, y -42, w +0, h +4; 38 px removed: y -4.
- `list tools`: x +0, y -38, w +0, h -4; 38 px removed: y +0.
- `group · NEEDS YOU`: x +0, y -42, w +0, h +4; 38 px removed: y -4.
- `group · NEXT STEPS`: x +0, y -22, w +0, h +4; 38 px removed: y +16.
- `group · SNOOZED`: x +0, y -9, w +0, h +4; 38 px removed: y +29.
- `filter popover`: x +0, y -58, w +0, h +60; 38 px removed: y -20.

## Deviations

- **Status bar.** Figma draws a 38 px status bar (9:41) at the top of
  the frame; the app has none (d-089: device chrome belongs to the
  canvas), so the render starts at y 0 and every layer anchored to the
  top is 38 px higher (`y -38`). The position check measures from the
  frame's top, so no phone frame can pass it; the offsets above give
  the rest as "38 px removed". The open request
  `projects/ncc-1701/inbox/fidelity-status-bar-offset.md` in Erik's
  brain asks how to measure it (it names the phone frames too).
  Figma's home indicator (the bar at the bottom) and the frame's
  rounded corners are device chrome too (d-089): the render draws
  neither. Library gap: Top and bottom safe areas on the phone.
- **List rows and group headers.** As in D01 and T01: `ListRow
  density="compact"` rows are 58 px against Figma's 55 and group
  headers 38 against 34 (4 px grid, d-072), so each later group starts
  lower (`group · NEXT STEPS` y +16, `group · SNOOZED` y +29 with the
  status bar removed) and the list is taller (`inbox list` h +19).
  Library gap: Small text in the detail.
- **Header, chips and tools.** `PageHeader size="phone"` is 40 px high
  against Figma's 44 (`header` h -4) and the tools row 40 against 44
  (`list tools` h -4); the chip row's box is 34 against Figma's 30
  (`filter · chips` h +4), so it and `group · NEEDS YOU` start 4 px
  higher. Library gaps: Search field and chip count text, Breakpoint
  tokens.
- **Row inset and title.** Figma's phone rows pad their content 4 at
  the sides (346:9052), so the kind tiles line up under the group
  chevrons; `ListRow` pads 10 inside a 1 px border. The phone pulls each
  row 6 px out of the list's padding, so the tile sits at x 17 against
  16 and the age ends at 373, as in Figma; the row's own box is 6 px
  wider each side, which shows only on a selected row. The large title
  sits 4 in from the header's edge (x 16), as in Figma. Library gap:
  List row padding on the phone.
- **Chip size.** Figma's phone chips pad their label 12 at the sides
  (`chip · All` 346:9014, 51 wide); `FilterChips size="compact"` pads
  8 with a 1 px border, as the tablet's chips (T1), so each chip is 6 px
  narrower and the row starts 2 px in. The gaps between the chips are 6,
  as in Figma. Library gap: Filter chip padding on the phone.
- **Chip row.** Figma's chip row runs past the list and scrolls
  sideways, the Done chip cut at the list's edge; the render does the
  same (the `hiddenOverflow` exception says why) and fades the
  cut edge over 24 px against Figma's 36. Library gap: Chip row fade.
- **Sort and Filter.** Icon buttons (`Button iconOnly`), 32 px square
  as in Figma (346:9036, 346:9041).
- **Filter sheet.** `BottomSheet` titled Filter with Clear, the Filter
  menu's boxes and Show 6 tasks, which closes the sheet and applies the
  boxes. The boxes are 32 px apart against Figma's 30 (as in D4 and
  T14) and the section labels are `GroupHeader`s, so the boxes run 60
  px taller (`filter popover` h +60) and the sheet starts higher
  (`filter popover` y -20 with the status bar removed). Clear shows the
  focus ring: the sheet focuses its first control. Library gaps: Styles
  that differ from Figma, Bottom sheet sections and data attribute.
- **Button labels.** Button labels are 14 px (`label`) at every size;
  Figma sets small buttons in Medium 12 or 13. Library gap: Button label
  size.
