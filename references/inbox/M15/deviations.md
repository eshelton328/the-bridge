# M15 deviations

What still differs from Figma M15 · Sorted by project (`sortedList`), after the last
fidelity run (`pnpm fidelity inbox M15`, 2026-11-17, library
1.0.0-beta.4), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (57 strings checked; 3 Figma strings under exceptions.json).
- Position: 2 of 10 layers pass (`group · RUNNING`, `tab bar`).
- Rules: pass (2 findings under exceptions.json).

## Failing layers

Render minus Figma, in px; "38 px removed" is the y offset without the
status bar.

- `inbox list`: x +0, y -38, w +0, h +33; 38 px removed: y +0.
- `header`: x +0, y -38, w +0, h -4; 38 px removed: y +0.
- `filter · chips`: x +0, y -42, w +0, h +4; 38 px removed: y -4.
- `list tools`: x +0, y -38, w +0, h -4; 38 px removed: y +0.
- `sort applied`: x +0, y -42, w +0, h -2; 38 px removed: y -4.
- `group · NEEDS YOU`: x +0, y -44, w +0, h +4; 38 px removed: y -6.
- `group · NEXT STEPS`: x +0, y -20, w +0, h +4; 38 px removed: y +18.
- `group · SNOOZED`: x +0, y -6, w +0, h +4; 38 px removed: y +32.

## Deviations

- **Status bar.** Figma draws a 38 px status bar (9:41) at the top of
  the frame; the app has none (d-089: device chrome belongs to the
  canvas), so the render starts at y 0 and every layer anchored to the
  top is 38 px higher (`y -38`). The position check measures from the
  frame's top, so no phone frame can pass it; the offsets above give
  the rest as "38 px removed". The open request
  `projects/ncc-1701/inbox/fidelity-status-bar-offset.md` in Erik's
  brain asks how to measure it (it names the phone frames too).
  Library gap: Top and bottom safe areas on the phone.
- **List rows and group headers.** As in M01: `ListRow
  density="compact"` rows are 58 px against Figma's 55 and group
  headers 38 against 34 (4 px grid, d-072), so each later group starts
  lower and the list is taller (`inbox list` h). Library gap: Small
  text in the detail.
- **Header, chips and tools.** As in M01: `PageHeader size="phone"` is
  40 px high against Figma's 44 (`header` h -4) and the tools row 40
  against 44 (`list tools` h -4); the chip row's box is 34 against
  Figma's 30 (`filter · chips` h +4), so it and the first group start
  4 px higher. Library gaps: Search field and chip count text,
  Breakpoint tokens.
- **Rows and chips on the phone.** As in M01: the rows are pulled 6 px
  out of the list's padding so the kind tiles line up under the group
  chevrons (Library gap: List row padding on the phone), and each chip
  pads its label 8 against Figma's 12 (Library gap: Filter chip padding
  on the phone).
- **Chip row.** The chips scroll sideways and the row clips them, as
  Figma does, but draws no fade at the cut edge (the `hiddenOverflow`
  exception says why). Library gap: Chip row fade.
- **Sorted by project.** On the phone a sort other than Newest first
  shows a line under the tools, "Sorted by project" and Reset, which
  brings back Newest first (`InboxRoute.test.tsx`); the Sort icon is
  pressed with its cyan dot (`Button indicator`). The line is 16 px
  high against Figma's 18 (`sort applied` h -2). Each group has a
  heading per project (`GroupHeader variant="project"`).
- **Below the fold.** SNOOZED and RUNNING lie under the tab bar in
  Figma and in the render (the exceptions say why).
- **Button labels.** Button labels are 14 px (`label`) at every size;
  Figma sets small buttons in Medium 12 or 13. Library gap: Button label
  size.
