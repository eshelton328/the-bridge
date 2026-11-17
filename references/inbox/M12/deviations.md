# M12 deviations

What still differs from Figma M12 · Done (`doneList`), after the last
fidelity run (`pnpm fidelity inbox M12`, 2026-11-17, library
1.0.0-beta.4), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (39 strings checked).
- Position: 1 of 7 layers pass (`tab bar`).
- Rules: pass (1 findings under exceptions.json).

## Failing layers

Render minus Figma, in px; "38 px removed" is the y offset without the
status bar.

- `inbox list`: x +0, y -38, w +0, h +10; 38 px removed: y +0.
- `header`: x +0, y -38, w +0, h -4; 38 px removed: y +0.
- `filter · chips`: x +0, y -42, w +0, h +4; 38 px removed: y -4.
- `list tools`: x +0, y -38, w +0, h -4; 38 px removed: y +0.
- `group · TODAY`: x +0, y -42, w +0, h +4; 38 px removed: y -4.
- `group · YESTERDAY`: x +0, y -28, w +0, h +4; 38 px removed: y +10.

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
  Figma's 30 (`filter · chips` h +4), so it and `group · TODAY` start
  4 px higher. Library gaps: Search field and chip count text,
  Breakpoint tokens.
- **Rows and chips on the phone.** As in M01: the rows are pulled 6 px
  out of the list's padding so the kind tiles line up under the group
  chevrons (Library gap: List row padding on the phone), and each chip
  pads its label 8 against Figma's 12 (Library gap: Filter chip padding
  on the phone).
- **Chip row.** The chips scroll sideways and the row clips them, as
  Figma does (the `hiddenOverflow` exception says why). With Done
  selected Figma scrolls All (346:11406) wholly off the left edge under
  its fade. The render's chips pad 8 against 12, so the row (40 px narrower
  than Figma's) overflows the list by less than All's width: scrolled to
  its end it still shows about 24 px of All, its count "7" among them, under the library's 24 px fade
  (the second review reads the "7"). No scroll position hides it; the
  12 px chip padding would. Library gaps: Chip row fade, Filter chip
  padding on the phone.
- **Selected chip.** With Done selected, the chip row scrolls Done into
  view and All off to the left, as Figma draws it. `FilterChips` scrolls
  a chip into view only when it takes the focus, so `InboxListPane`
  scrolls the selected chip into view when the filter changes
  (`InboxRoute.test.tsx`). Library gap: Selected chip in view.
- **Finished rows.** Each row says how it ended, in green or grey. The
  outcome line is `small` (13 px) against Figma's Regular 12, and the
  titles keep the default colour where Figma dims them a step. Library
  gaps: Small sans text for row lines, Styles that differ from Figma.
  A finished row has no actions, so it has no long-press; it still sits
  in line with the other phone rows.
