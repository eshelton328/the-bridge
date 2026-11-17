# M22 deviations

What still differs from Figma M22 · The new tasks in the inbox (`tasksCreatedPhone`), after the last
fidelity run (`pnpm fidelity inbox`, 2026-11-17, library
1.0.0-beta.5, which adds #104 to #106), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (48 strings checked, 17 excepted in `exceptions.json`).
- Position: 1 of 8 layers pass (`tab bar`).
- Rules: pass (1 findings under exceptions.json).

## Failing layers

Render minus Figma, in px; "38 px removed" is the y offset without the
status bar.

- `header`: x +0, y -38, w +0, h -4; 38 px removed: y +0.
- `filter · chips`: x +0, y -42, w +0, h +4; 38 px removed: y -4.
- `list tools`: x +0, y -38, w +0, h -4; 38 px removed: y +0.
- `group · NEEDS YOU`: x +0, y -42, w +0, h +4; 38 px removed: y -4.
- `group · NEXT STEPS`: x +0, y -38, w +0, h +4; 38 px removed: y +0.
- `group · SNOOZED`: x +0, y -16, w +0, h +4; 38 px removed: y +22.
- `toast · created`: x -4, y +0, w +8, h +0; anchored to the bottom, no status bar offset.

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
- **Needs you closed.** Figma closes Needs you on the phone, where T21
  opens it, so M22 has its own state. Figma keeps the closed group's
  rows in its layers, all at y 212; `exceptions.json` lists their text
  as hidden layers.
- **New rows.** The new tasks are `ListRow` rows with a `StatusPill`
  "New"; Figma draws them as bordered rows on a raised fill. Library
  gap: New list row.
- **Toast.** `Toast` over the bottom of the list, full width less the
  list's padding (`toast · created` x -4, w +8). It is anchored to the
  bottom, 12 above the tab bar, as Figma draws it (`toast · created` y
  +0): the list fills the screen above the tab bar when it has a toast.
  It used to follow the last group, 47 above the tab bar. The new tasks
  come from the discussion's proposal applied in the state's `ui`, so
  Undo takes them out (`InboxRoute.test.tsx`).
- **Button labels.** Button labels are 14 px (`label`) at every size;
  Figma sets small buttons in Medium 12 or 13, so the buttons are a
  little wider. Library gap: Button label size.
