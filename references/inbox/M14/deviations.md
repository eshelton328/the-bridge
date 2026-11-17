# M14 deviations

What still differs from Figma M14 · Search (`searchList`), after the last
fidelity run (`pnpm fidelity inbox`, 2026-11-17, library
1.0.0-beta.5, which adds #104 to #106), each with its reason. The library gaps are in
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
- **Search.** The field shows "f-005" with its clear button, Sort and
  Filter beside it, the summary under the tools and the matches marked
  in cyan, in their groups. Figma draws the field focused with a caret
  and the keyboard up. The story focuses the field (`toHaveFocus`, the
  T10 and M14 story), so the render shows its focused border; the
  keyboard is design-only chrome (d-089), so none covers the list, and
  the Done hint shows under the Running row (`done hint` y +20 with the
  status bar removed).
  Figma's metadata gives the summary and the hint by their layer names;
  the exceptions say why.
- **Show it.** The Done hint's link selects the Done chip, which lists
  the match in Done: the search state holds that Done list (one finished
  task, "Save the Inbox frames as references"), which no frame draws, and
  the hint leaves while Done is selected (`InboxRoute.test.tsx`,
  `listView.test.ts`).
