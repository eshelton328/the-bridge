# T11 deviations

What still differs from Figma T11 · Sorted by project (the list sorted by project, `sortedList`, the list of D11 `sortedByProject`), after the last
fidelity run (`pnpm fidelity inbox T11`, 2026-11-17, library
1.0.0-beta.4), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (62 strings).
- Position: 1 of 9 layers pass (`tab bar`).
- Rules: pass.

## Failing layers

Render minus Figma, in px; "29 px removed" is the y offset without the
status bar.

- `inbox list`: x +2, y -29, w -4, h +37; 29 px removed: y +0.
- `header`: x +2, y -29, w -4, h -2; 29 px removed: y +0.
- `filter · chips`: x +2, y -31, w -4, h +4; 29 px removed: y -2.
- `list tools`: x +2, y -27, w -4, h -4; 29 px removed: y +2.
- `group · NEEDS YOU`: x +2, y -31, w -4, h +4; 29 px removed: y -2.
- `group · NEXT STEPS`: x +2, y -7, w -4, h +4; 29 px removed: y +22.
- `group · SNOOZED`: x +2, y +7, w -4, h +4; 29 px removed: y +36.
- `group · RUNNING`: x +2, y +11, w -4, h +4; 29 px removed: y +40.

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
  lower and the list is taller (`inbox list` h). Library gap: Small text
  in the detail.
- **Project headings.** Each project heading is the library's
  `GroupHeader variant="project"`, taller than Figma's (#96 rows on the 4
  px grid), so each later group starts lower (`group · SNOOZED`,
  `group · RUNNING`). Library gap: Styles that differ from Figma.
- **Tab bar.** `TabBar` spreads its five tabs over the full width;
  Figma centres five 91 px tabs. The bar itself (`tab bar`) is in place.
  Library gap: Tablet tab bar.
- **Button labels.** Button labels are 14 px (`label`) at every size;
  Figma sets small buttons in Medium 12 or 13, so the buttons are a
  little wider. Library gap: Button label size.

## Second review

A separate agent compared the side-by-side picture with the render,
blind to how it was built (2026-11-17). Each finding, fixed or with why
it stays:

- The search icon and placeholder lighter and about 1 px larger (F1, F3), and the chip counts as bright as their labels (F2): stays. Library gap: Search field and chip count text.
- The chip row 2 px closer to the title (F4): stays. The header is 40 px high (`PageHeader size="phone"`, a 40 px line) against Figma's 42 (`header` h -2), so the chips start 2 px higher (`filter · chips` y -2 once the status bar is removed). No token gives 42 (4 px grid, d-072). Library gap: Styles that differ from Figma.
