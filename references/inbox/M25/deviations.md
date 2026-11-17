# M25 deviations

What still differs from Figma M25 · Removed, in Done (`removedPhone`), after the last
fidelity run (`pnpm fidelity inbox`, 2026-11-17, library
1.0.0-beta.5, which adds #104 to #106), each with its reason. The library gaps are in
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
  Figma's home indicator (the bar at the bottom) and the frame's
  rounded corners are device chrome too (d-089): the render draws
  neither. Library gap: Top and bottom safe areas on the phone.
- **List rows and group headers.** As in M01: `ListRow
  density="compact"` rows are 58 px against Figma's 55 and group
  headers 38 against 34 (4 px grid, d-072), so each later group starts
  lower. Library gap: Small text in the detail.
- **Header, chips and tools.** As in M01: `PageHeader size="phone"` is
  40 px high against Figma's 44 (`header` h -4) and the tools row 40
  against 44 (`list tools` h -4); the chip row's box is 34 against
  Figma's 30 (`filter · chips` h +4). Library gap: Breakpoint tokens.
  The search field's text and placeholder are 13 px
  (`SearchField textSize="sm"`, `bodySm`), and an idle chip's count is
  `fg.subtle` (#7986a6, beta.5); Figma's #4a5675 stays out by d-099,
  because it fails WCAG AA (d-055).
- **Rows and chips on the phone.** As in M01: the rows are pulled 6 px
  out of the list's padding so the kind tiles line up under the group
  chevrons (Library gap: List row padding on the phone), and each chip
  pads its label 8 against Figma's 12 (Library gap: Filter chip padding
  on the phone). The chip row scrolls sideways and clips, as Figma's
  does; the fade is missing (Library gap: Chip row fade).
- **Next steps count.** Figma counts 5 next steps here, after the
  three tasks M22 created; T24 counts 2. The state copies M25's count,
  so it has its own state.
- **Finished rows.** As in M12: each row says how it ended, the removed
  one in red with a bin. The outcome line is `small` (13 px) against
  Figma's Regular 12. Library gaps: Small sans text for row lines,
  Styles that differ from Figma.
- **Restore.** The note says the removed task's page has Restore, which
  no frame draws (D21 draws it on the desktop). Opening the row shows
  that page with Open discussion and Restore; Restore puts the task back
  in Next steps and the page shows it as a next step again
  (`InboxRoute.test.tsx`, from the keyboard too). The note also says
  none of this flow is decided: the removal, the Done row and Restore
  are built as Figma draws them and wait for Erik's decision.
