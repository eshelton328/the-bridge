# T21 deviations

What still differs from Figma T21 · The new tasks in the inbox (`tasksCreatedList`, D18's list on the tablet), after the last
fidelity run (`pnpm fidelity inbox T21`, 2026-11-17, library
1.0.0-beta.4), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass.
- Position: 1 of 8 layers pass (`tab bar`).
- Rules: pass.

## Failing layers

Render minus Figma, in px; "29 px removed" is the y offset without the
status bar.

- `header`: x +2, y -29, w -4, h -2; 29 px removed: y +0.
- `filter · chips`: x +2, y -31, w -4, h +4; 29 px removed: y -2.
- `list tools`: x +2, y -27, w -4, h -4; 29 px removed: y +2.
- `group · NEEDS YOU`: x +2, y -31, w -4, h +4; 29 px removed: y -2.
- `group · NEXT STEPS`: x +2, y -11, w -4, h +4; 29 px removed: y +18.
- `group · SNOOZED`: x +2, y +11, w -4, h +4; 29 px removed: y +40.
- `toast · created`: x -144, y -21, w +288, h +0; anchored to the bottom, no status bar offset.

## Deviations

- **Status bar.** Figma draws a 29 px status bar (9:41) at the top of
  the frame; the app has none (d-089: device chrome belongs to the
  canvas), so the render starts at y 0 and every layer anchored to the
  top is about 29 px higher (`y -29`). The position check measures from
  the frame's top, so these layers fail by the status bar alone; the
  offsets above give the rest as "29 px removed". Measuring below the
  status bar is an open request to Erik. Library gap: Top and bottom
  safe areas on the tablet.
- **Side inset.** `Container size="tablet"` pads 24 against Figma's 22,
  so every full-width layer is `x +2, w -4` (within the tolerance).
- **List rows and group headers.** As in T01: `ListRow
  density="compact"` rows are 58 px against Figma's 55 and group
  headers 38 against 34 (4 px grid, d-072), so each later group starts
  lower. Library gaps: Small text in the detail, Search field and chip
  count text.
- **New rows.** The new tasks are `ListRow` rows with a `StatusPill`
  "New"; Figma draws them as bordered rows on a raised fill. Library
  gap: New list row.
- **Toast.** `Toast` takes the list's width (708 px); Figma's is 420
  px and centred (`toast · created` x -144, w +288). It sticks to the
  bottom of the list, 21 px higher than Figma's toast over the tab bar
  (`toast · created` y -21). Library gap: Toast
  width on the tablet. Its Undo takes back tasks Erik created on the
  discussion page; this state's tasks are drawn by its data, so Undo
  here changes nothing.
- **Tab bar.** `TabBar` spreads its five tabs over the full width
  (about 148 px each, Home at x 8); Figma centres five 91 px tabs from
  x 150. The bar itself (`tab bar`) is in place. Library gap: Tablet tab
  bar.
- **Button labels.** Button labels are 14 px (`label`) at every size;
  Figma sets small buttons in Medium 12 or 13, so the buttons are a
  little wider. Library gap: Button label size.

## Second review, round 2

A second blind review compared `frame.png` with the render (2026-11-17). Each finding, fixed or with why it stays:

- Search placeholder larger and lighter, chip counts lighter (P3): already recorded. Library gap: Search field and chip count text.
