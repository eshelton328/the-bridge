# M16 deviations

What still differs from Figma M16 · Filtered (`filteredList`), after the last
fidelity run (`pnpm fidelity inbox`, 2026-11-17, library
1.0.0-beta.5, which adds #104 to #106), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (56 strings checked; 1 Figma strings under exceptions.json).
- Position: 2 of 11 layers pass (`hidden count`, `tab bar`).
- Rules: pass (2 findings under exceptions.json).

## Failing layers

Render minus Figma, in px; "38 px removed" is the y offset without the
status bar.

- `inbox list`: x +0, y -38, w +0, h +24; 38 px removed: y +0.
- `header`: x +0, y -38, w +0, h -4; 38 px removed: y +0.
- `filter · chips`: x +0, y -42, w +0, h +4; 38 px removed: y -4.
- `list tools`: x +0, y -38, w +0, h -4; 38 px removed: y +0.
- `filters applied`: x +0, y -42, w +0, h +2; 38 px removed: y -4.
- `group · NEEDS YOU`: x +0, y -40, w +0, h +4; 38 px removed: y -2.
- `group · NEXT STEPS`: x +0, y -20, w +0, h +4; 38 px removed: y +18.
- `group · SNOOZED`: x +0, y -13, w +0, h +4; 38 px removed: y +25.
- `group · RUNNING`: x +0, y -9, w +0, h +4; 38 px removed: y +29.

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
- **List rows and group headers.** As in M01: `ListRow
  density="compact"` rows are 58 px against Figma's 55 and group
  headers 38 against 34 (4 px grid, d-072), so each later group starts
  lower and the list is taller (`inbox list` h). Library gap: Small
  text in the detail.
- **Header, chips and tools.** As in M01: `PageHeader size="phone"` is
  40 px high against Figma's 44 (`header` h -4) and the tools row 40
  against 44 (`list tools` h -4); the chip row's box is 34 against
  Figma's 30 (`filter · chips` h +4), so it and the first group start
  4 px higher. Library gap: Breakpoint tokens. The search field's text and placeholder are 13 px
  (`SearchField textSize="sm"`, `bodySm`), and an idle chip's count is
  `fg.subtle` (#7986a6, beta.5); Figma's #4a5675 stays out by d-099,
  because it fails WCAG AA (d-055).
- **Rows and chips on the phone.** As in M01: the rows are pulled 6 px
  out of the list's padding so the kind tiles line up under the group
  chevrons (Library gap: List row padding on the phone), and each chip
  pads its label 8 against Figma's 12 (Library gap: Filter chip padding
  on the phone).
- **Chip row.** The chips scroll sideways and the row clips them, as
  Figma does, and fades the cut edge over 24 px
  against Figma's 36 (the `hiddenOverflow`
  exception says why). Library gap: Chip row fade.
- **Filters that apply.** The Filter icon is pressed with its cyan dot
  (`Button indicator`), and the row under the tools lists Project with
  ncc-1701 and omni-brain, each with an x that removes it, and Clear.
  Each value is a pressed small `Button`, 28 px high against Figma's
  22 px chips (`filters applied` h +2). Library gap: Removable filter
  chip.
- **Hidden count.** "1 task hidden by filters" ends the list, under the
  tab bar, as in Figma (`hidden count` passes); Figma's metadata gives
  the text by its layer name, and the exception says why.
- **Button labels.** Button labels are 14 px (`label`) at every size;
  Figma sets small buttons in Medium 12 or 13. Library gap: Button label
  size.
