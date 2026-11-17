# T14 deviations

What still differs from Figma T14 · Filter (the Filter menu open over the list, `filterList`, T1 `list` with skill-evals cleared in the menu), after the last
fidelity run (`pnpm fidelity inbox`, all 70 frames, 2026-11-17,
against the installed library 1.0.0-beta.5, which has #104 to #106), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (85 strings).
- Position: 2 of 9 layers pass (`group · SNOOZED`, `tab bar`).
- Rules: pass.

## Failing layers

Render minus Figma, in px; "29 px removed" is the y offset without the
status bar.

- `inbox list`: x +2, y -29, w -4, h +21; 29 px removed: y +0.
- `header`: x +2, y -29, w -4, h -2; 29 px removed: y +0.
- `filter · chips`: x +2, y -31, w -4, h +4; 29 px removed: y -2.
- `list tools`: x +2, y -27, w -4, h -4; 29 px removed: y +2.
- `group · NEEDS YOU`: x +2, y -31, w -4, h +4; 29 px removed: y -2.
- `group · NEXT STEPS`: x +2, y -11, w -4, h +4; 29 px removed: y +18.
- `filter popover`: x -2, y -31, w +0, h +62; 29 px removed: y -2.

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
  as Figma's (346:8703). Idle chip counts are `fg.subtle` (#7986a6, #106);
  Figma's #4a5675 stays out by d-099, because it fails WCAG AA (d-055).
- **Filter menu.** As in D04: the `Checkbox size="sm"` rows are 34 px
  against Figma's 30 (4 px grid), so the popover is 62 px taller
  (`filter popover` h +62). Its boxes apply when it closes, so the list
  still shows the skill-evals next step, as Figma draws it.
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

- The Filter menu's checkbox rows inset about 9 px against Figma's 16, and the counts about 12 px from the right against 20 (F1): fixed. Figma insets each row 8 inside the popover's 9 px padding (346:8879: the box at x 451, the count ending at 717 in a row ending at 725); `FilterMenu` now pads each row 8 (`px: '8'`), so the boxes line up with the section labels and the counts end 8 before the row. `Checkbox` has no inset of its own; D04 gets the same fix.
- "Showing 6 of 7" a little larger and lighter (F2): stays. It is the popover's `small` note in `fg.muted`, against Figma's 11 px (346:8972, a 14 px box; `small` is 12) in #4a5675, which `fg.subtle` has but which is not for `surface.overlay` (d-055). Library gaps: Small sans text for row lines, Styles that differ from Figma.
- Black shapes, unstyled text and a white "Clear" box over the Figma side: a defect of the side-by-side picture, not of the reference or the render. See below.

## Side-by-side image

The second review saw the open Filter menu's icons and text drawn unstyled
on the Figma side of `T14.sideBySide.png`; the saved `frame.png` and
the render side did not have them. #13 changed `composeSideBySide` in
`scripts/fidelity/fidelity.ts` to draw the side-by-side in a fresh
page. After this branch was rebased onto it, `pnpm fidelity inbox T14`
draws the Figma side of `T14.sideBySide.png` without them.
