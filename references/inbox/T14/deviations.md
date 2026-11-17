# T14 deviations

What still differs from Figma T14 · Filter (the Filter menu open over the list, `filterList`, T1 `list` with skill-evals cleared in the menu), after the last
fidelity run (`pnpm fidelity inbox`, all 70 frames, 2026-11-17,
against the installed library 1.0.0-beta.7, which has #107 and #108; updated on 2026-11-17 with library 1.0.0-beta.8, #109, and 1.0.0-beta.9, #110 and #111, and no layer of this frame moved), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (85 strings).
- Position: 6 of 9 layers pass (`header`, `filter · chips`, `list tools`, `group · NEEDS YOU`, `group · NEXT STEPS`, `tab bar`).
- Rules: pass.

## Failing layers

Render minus Figma, in px. All three checks render the page 29 px
shorter, below Figma's status bar (d-102), and the position check adds
29 to each render y (d-101).

- `inbox list`: x +2, y +0, w -4, h -5.
- `group · SNOOZED`: x +2, y +7, w -4, h +2.
- `filter popover`: x -2, y -2, w +0, h +62.

## Deviations

- **Status bar.** Figma draws a 29 px status bar (9:41) at the top of
  the frame; the app has none (d-089: device chrome belongs to the
  canvas). All three checks render the page 29 px shorter (d-102),
  so text under its bottom edge counts as not shown, and the position
  check adds 29 to each render y (d-101), so a layer anchored to the top or to the
  bottom compares true, and the side-by-side draws the render 29 px
  lower, under a blank band where Figma has the bar. Library gap:
  Top and bottom safe areas on the tablet.
- **Side inset.** `Container size="tablet"` pads 24 against Figma's 22,
  so every full-width layer is `x +2, w -4` (within the tolerance).
- **List rows and group headers.** As in T01: `ListRow
  density="compact"` rows are 56 px against Figma's 55 and group
  headers 36 against 34, the 4 px grid values nearest Figma's (d-100,
  library #108), so each later group starts a little lower
  (`group · SNOOZED` y +7). The list is 5 px shorter than Figma's
  (`inbox list` h -5).
- **Search field and chip counts.** The search field's text and
  placeholder are 13 px (`SearchField textSize="sm"`, `bodySm`, #106),
  as Figma's (346:8703). Idle chip counts are `fg.subtle` (#7986a6, #106);
  Figma's #4a5675 stays out by d-099, because it fails WCAG AA (d-055).
- **Filter menu.** As in D04: the `Checkbox size="sm"` rows are 34 px
  against Figma's 30 (4 px grid), so the popover is 62 px taller
  (`filter popover` h +62). Its boxes apply when it closes, so the list
  still shows the skill-evals next step, as Figma draws it. Since beta.9
  it is `Popover surface="raised"`: an opaque `surface.raised` fill
  (#17213a), as Figma fills it (D4 346:1737), so the list no longer
  shows through it.
- **Tab bar.** `TabBar` spreads its five tabs over the full width;
  Figma centres five 91 px tabs. The bar itself (`tab bar`) is in place.
  Library gap: Tablet tab bar.
- **Button labels.** Newest and Filter take `Button textSize="sm"`
  (Medium 13, #105), as Figma draws them. The approval row's Allow
  once, Deny and Open chat take `textSize="xs"` (`labelXs`, Medium
  12/16), Figma's Medium 12 (d-100). The Filter menu's Clear is
  `Button size="sm" textSize="xs"` (Medium 12/16), as Figma sets it
  (346:8975, read from Figma; library #109, beta.8). The labels match.
- **Beta.7 (2026-11-17).** Library 1.0.0-beta.6 and beta.7 (#107,
  #108) move these layers: `inbox list` x +2, y +0, w -4, h -5 (was x
  +2, y +0, w -4, h +21); `group · NEXT STEPS` within tolerance (was x
  +2, y +18, w -4, h +4); `group · SNOOZED` x +2, y +7, w -4, h +2
  (was x +2, y +31, w -4, h +4). The cause is #108's compact `ListRow`
  (56 px, was 58; Figma 55) and list `GroupHeader` (36 px, was 38;
  Figma 34).
- **Beta.9 (2026-11-17).** Library 1.0.0-beta.9 (#110, #111) gives the
  Filter menu an opaque fill: `Popover surface="raised"`
  (`surface.raised`, #17213a, Figma's; was `surface.overlay`, alpha
  0.98). No layer of this frame moved.

## Second review

A separate agent compared the side-by-side picture with the render,
blind to how it was built (2026-11-17). Each finding, fixed or with why
it stays:

- The Filter menu's checkbox rows inset about 9 px against Figma's 16, and the counts about 12 px from the right against 20 (F1): fixed. Figma insets each row 8 inside the popover's 9 px padding (346:8879: the box at x 451, the count ending at 717 in a row ending at 725); `FilterMenu` now pads each row 8 (`px: '8'`), so the boxes line up with the section labels and the counts end 8 before the row. `Checkbox` has no inset of its own; D04 gets the same fix.
- "Showing 6 of 7" a little larger and lighter (F2): stays. It is the popover's `small` note in `fg.muted`, against Figma's 11 px (346:8972, a 14 px box; `small` is 12) in #4a5675, `fg.subtle`'s role; `fg.subtle` is not for `surface.raised`, the menu's fill since beta.9 (d-055). Library gaps: Small sans text for row lines, Styles that differ from Figma.
- Black shapes, unstyled text and a white "Clear" box over the Figma side: a defect of the side-by-side picture, not of the reference or the render. See below.

## Side-by-side image

The second review saw the open Filter menu's icons and text drawn unstyled
on the Figma side of `T14.sideBySide.png`; the saved `frame.png` and
the render side did not have them. #13 changed `composeSideBySide` in
`scripts/fidelity/fidelity.ts` to draw the side-by-side in a fresh
page. After this branch was rebased onto it, `pnpm fidelity inbox T14`
draws the Figma side of `T14.sideBySide.png` without them.
