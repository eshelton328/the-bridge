# T15 deviations

What still differs from Figma T15 · Filtered (the list with a project filter, `filteredList`, the list of D13 `filtered`), after the last
fidelity run (`pnpm fidelity inbox`, all 70 frames, 2026-11-17,
against the installed library 1.0.0-beta.5, which has #104 to #106), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (58 strings; 1 excepted in `exceptions.json`).
- Position: 3 of 11 layers pass (`group · SNOOZED`, `group · RUNNING`, `tab bar`).
- Rules: pass.

## Failing layers

Render minus Figma, in px; "29 px removed" is the y offset without the
status bar.

- `inbox list`: x +2, y -29, w -4, h +26; 29 px removed: y +0.
- `header`: x +2, y -29, w -4, h -2; 29 px removed: y +0.
- `filter · chips`: x +2, y -31, w -4, h +4; 29 px removed: y -2.
- `list tools`: x +2, y -27, w -4, h -4; 29 px removed: y +2.
- `filters applied`: x +2, y -31, w -4, h +2; 29 px removed: y -2.
- `group · NEEDS YOU`: x +2, y -29, w -4, h +4; 29 px removed: y +0.
- `group · NEXT STEPS`: x +2, y -9, w -4, h +4; 29 px removed: y +20.
- `hidden count`: x +2, y +11, w -1.3, h +0; 29 px removed: y +40.

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
- **Search field and chip counts.** The search field's text and
  placeholder are 13 px (`SearchField textSize="sm"`, `bodySm`, #106),
  as Figma's (359:349). Idle chip counts are `fg.subtle` (#7986a6, #106);
  Figma's #4a5675 stays out by d-099, because it fails WCAG AA (d-055).
- **Filters that apply.** The library has no removable filter chip;
  a pressed small `Button` with an x stands for each value (`filters
  applied` h +2). Library gap: Removable filter chip.
- **Hidden count.** The line under the list sits lower by the taller
  rows above it (`hidden count`).
- **Layer names as text.** `exceptions.json` excepts the strings that
  get_metadata gives as a layer's name instead of its characters, with
  the text frame.png shows, as D09, D10 and D13 do.
- **Tab bar.** `TabBar` spreads its five tabs over the full width;
  Figma centres five 91 px tabs. The bar itself (`tab bar`) is in place.
  Library gap: Tablet tab bar.
- **Button labels.** Newest and Filter take `Button textSize="sm"`
  (Medium 13, #105), as Figma draws them. The other labels are 14 px
  (`label`), where Figma sets small buttons in Medium 12 (no token,
  d-050), so those buttons are a little wider. Library gap: Button
  label size.

## Second review

A separate agent compared the side-by-side picture with the render,
blind to how it was built (2026-11-17). Each finding, fixed or with why
it stays:

- The values that apply ("ncc-1701", "omni-brain") in sans 14 px against Figma's small mono chips (F1): fixed in part. Each value is now in `monoSm` (Geist Mono 11, as 359:539 is). The chip is still a pressed small `Button` (taller, with a 12 px x and the button's border) because the library has no removable filter chip. Library gap: Removable filter chip.
- The search placeholder larger and lighter (F2): fixed in part by beta.5: the placeholder is 13 px, as Figma's; its colour stays `fg.subtle` by d-055.
