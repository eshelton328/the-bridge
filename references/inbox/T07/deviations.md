# T07 deviations

What still differs from Figma T7 · Done (Done, the list, `doneList`), after the last
fidelity run (`pnpm fidelity inbox T07`, 2026-11-16, library
1.0.0-beta.4), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass.
- Position: 1 of 7 layers pass (`tab bar`).
- Rules: pass.

## Failing layers

Render minus Figma, in px; "29 px removed" is the y offset without the
status bar.

- `inbox list`: x +2, y -29, w -4, h +12; 29 px removed: y +0.
- `header`: x +2, y -29, w -4, h -2; 29 px removed: y +0.
- `filter · chips`: x +2, y -31, w -4, h +4; 29 px removed: y -2.
- `list tools`: x +2, y -27, w -4, h -4; 29 px removed: y +2.
- `group · TODAY`: x +2, y -31, w -4, h +4; 29 px removed: y -2.
- `group · YESTERDAY`: x +2, y -17, w -4, h +4; 29 px removed: y +12.

## Deviations

- **Status bar.** Figma draws a 29 px status bar (9:41) at the top of
  the frame; the app has none (d-089: device chrome belongs to the
  canvas), so the render starts at y 0 and every layer anchored to the
  top is about 29 px higher (`y -29`). The position check measures from
  the frame's top, so these layers fail by the status bar alone; the
  offsets below give the rest as "29 px removed". Library gap: Top and
  bottom safe areas on the tablet.
- **Side inset.** `Container size="tablet"` pads 24 against Figma's 22,
  so every full-width layer is `x +2, w -4` (within the tolerance).
- **List rows and group headers.** As in D01: `ListRow
  density="compact"` rows are 58 px against Figma's 55 and group
  headers 38 against 34 (4 px grid, d-072), so each later group starts
  lower. Library gap: Small text in the detail.
- **Done rows.** Figma fades the kind tiles of done rows (0.6); no
  opacity token has it, and the fade waits on Erik (d-050). Library
  gap: Styles that differ from Figma.
- **Tab bar.** `TabBar` spreads its five tabs over the full width
  (about 148 px each, Home at x 8); Figma centres five 91 px tabs from
  x 150 (346:5574). The bar itself (`tab bar`) is in place. Library gap:
  Tablet tab bar.
- **Button labels.** Button labels are 14 px (`label`) at every size;
  Figma sets small buttons in Medium 12 or 13, so Snooze, Dismiss,
  Newest, Filter and the row actions are a little wider. Library gap:
  Button label size.
