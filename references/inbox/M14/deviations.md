# M14 deviations

What still differs from Figma M14 · Search (`searchList`), after the last
fidelity run (`pnpm fidelity inbox M14`, 2026-11-17, library
1.0.0-beta.4), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (38 strings checked; 2 Figma strings under exceptions.json).
- Position: 1 of 9 layers pass (`tab bar`).
- Rules: pass (1 findings under exceptions.json).

## Failing layers

Render minus Figma, in px; "38 px removed" is the y offset without the
status bar.

- `inbox list`: x +0, y -38, w +0, h +6; 38 px removed: y +0.
- `header`: x +0, y -38, w +0, h -4; 38 px removed: y +0.
- `filter · chips`: x +0, y -42, w +0, h +4; 38 px removed: y -4.
- `list tools`: x +0, y -38, w +0, h -4; 38 px removed: y +0.
- `search summary`: x +0, y -42, w -1.2, h +0; 38 px removed: y -4.
- `group · NEEDS YOU`: x +0, y -42, w +0, h +4; 38 px removed: y -4.
- `group · RUNNING`: x +0, y -27, w +0, h +4; 38 px removed: y +11.
- `done hint`: x +0, y -18, w +0, h +0; 38 px removed: y +20.

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
- **Search.** The field shows "f-005" with its clear button, Sort and
  Filter beside it, the summary under the tools and the matches marked
  in cyan, in their groups. Figma draws the field focused with a caret
  and the keyboard up (design-only chrome, d-089); the render's field is
  not focused, so no keyboard covers the list, and the Done hint shows
  under the Running row (`done hint` y +20 with the status bar removed).
  Figma's metadata gives the summary and the hint by their layer names;
  the exceptions say why.
- **Show it.** The Done hint's link does nothing yet: the search state's
  mock data holds no Done rows, and no frame draws the Done match it
  would show (also on D10 and T10).
