# M13 deviations

What still differs from Figma M13 · Sort (the Sort sheet over the list, `sortList`), after the last
fidelity run (`pnpm fidelity inbox M13`, 2026-11-17, library
1.0.0-beta.4), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (64 strings checked; 2 Figma strings under exceptions.json).
- Position: 1 of 9 layers pass (`tab bar`).
- Rules: pass (2 findings under exceptions.json).

## Failing layers

Render minus Figma, in px; "38 px removed" is the y offset without the
status bar.

- `inbox list`: x +0, y -38, w +0, h +25; 38 px removed: y +0.
- `header`: x +0, y -38, w +0, h -4; 38 px removed: y +0.
- `filter · chips`: x +0, y -42, w +0, h +4; 38 px removed: y -4.
- `list tools`: x +0, y -38, w +0, h -4; 38 px removed: y +0.
- `group · NEEDS YOU`: x +0, y -42, w +0, h +4; 38 px removed: y -4.
- `group · NEXT STEPS`: x +0, y -22, w +0, h +4; 38 px removed: y +16.
- `group · SNOOZED`: x +0, y -12, w +0, h +4; 38 px removed: y +26.
- `group · RUNNING`: x +0, y -8, w +0, h +4; 38 px removed: y +30.

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
  4 px higher. Library gaps: Search field and chip count text,
  Breakpoint tokens.
- **Rows and chips on the phone.** As in M01: the rows are pulled 6 px
  out of the list's padding so the kind tiles line up under the group
  chevrons (Library gap: List row padding on the phone), and each chip
  pads its label 8 against Figma's 12 (Library gap: Filter chip padding
  on the phone).
- **Chip row.** The chips scroll sideways and the row clips them, as
  Figma does, and fades the cut edge over 24 px
  against Figma's 36 (the `hiddenOverflow`
  exception says why). Library gap: Chip row fade.
- **Sort sheet.** The phone's Sort is a `BottomSheet` titled Sort with
  Done, the four choices as an `OptionList` with the check on Newest
  first, and the note under a rule. A choice sorts the list and closes
  the sheet, from a tap or the keyboard (`InboxRoute.test.tsx`).
  Figma's choices are 58 px rows 2 apart; `OptionList` rows are 56 with
  no gap, so the sheet is a little shorter and starts lower. `BottomSheet`
  takes no `data-*` attribute, so the position check cannot measure the
  sheet. Done is `Button variant="text" size="sm"`, plain cyan text as
  Figma draws it, and the sheet opens with the focus on itself, so no
  focus ring shows (`InboxRoute.test.tsx`). The header is about 3 px
  taller than Figma's 40 (346:11808): "Sort" sits 39 below the sheet's
  top against 36, "Newest first" 81 against 78.
  Library gaps: Sort sheet rows, Bottom sheet sections and data
  attribute.
- **Sort button.** While the sheet is open the Sort icon shows pressed
  (cyan), as on the tablet (T9); Figma dims it under the scrim.
- **Running row.** As in M11, its chat line and Working pill lie under
  the tab bar in Figma and in the render (the exceptions say why).
- **Button labels.** Button labels are 14 px (`label`) at every size;
  Figma sets small buttons in Medium 12 or 13. Library gap: Button label
  size.
