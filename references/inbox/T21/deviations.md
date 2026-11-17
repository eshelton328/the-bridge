# T21 deviations

What still differs from Figma T21 · The new tasks in the inbox (`tasksCreatedList`, D18's list on the tablet), after the last
fidelity run (`pnpm fidelity inbox`, all 70 frames, 2026-11-17,
against the installed library 1.0.0-beta.5, which has #104 to #106), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (67 strings checked; 0 Figma strings under exceptions.json).
- Position: 5 of 8 layers pass (`header`, `filter · chips`, `list tools`, `group · NEEDS YOU`, `tab bar`).
- Rules: fail: `hiddenOverflow` on `main.app-shell__detail` (0 other findings under exceptions.json).

## Failing layers

Render minus Figma, in px. All three checks render the page 29 px
shorter, below Figma's status bar (d-102), and the position check adds
29 to each render y (d-101).

- `group · NEXT STEPS`: x +2, y +18, w -4, h +4.
- `group · SNOOZED`: x +2, y +40, w -4, h +4.
- `toast · created`: x -144, y +8, w +288, h +0.

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
  density="compact"` rows are 58 px against Figma's 55 and group
  headers 38 against 34 (4 px grid, d-072), so each later group starts
  lower. Library gap: Small text in the detail.
- **Search field and chip counts.** The search field's text and
  placeholder are 13 px (`SearchField textSize="sm"`, `bodySm`, #106),
  as Figma's (402:11999). Idle chip counts are `fg.subtle` (#7986a6, #106);
  Figma's #4a5675 stays out by d-099, because it fails WCAG AA (d-055).
- **New rows.** The new tasks are `ListRow` rows with a `StatusPill`
  "New"; Figma draws them as bordered rows on a raised fill. Library
  gap: New list row.
- **Toast.** `Toast` takes the list's width (708 px); Figma's is 420
  px and centred (`toast · created` x -144, w +288). It sticks to the
  bottom of the list, which fills the screen above the tab bar. In the
  position check's page, 29 px shorter (d-101), it sits 8 above the tab
  bar against Figma's 16 (`toast · created` y +8); in the full 1158 px
  page it sits 20 above it.
  Library gap: Toast width on the tablet. Undo takes the new tasks out,
  as on the phone (M22): the state names the rows it draws as created,
  and Undo clears its applied Create (`InboxRoute.test.tsx`).
- **Tab bar.** `TabBar` spreads its five tabs over the full width
  (about 148 px each, Home at x 8); Figma centres five 91 px tabs from
  x 150. The bar itself (`tab bar`) is in place. Library gap: Tablet tab
  bar.
- **List 12 px too tall.** The checks render 1129 px high, the screen
  below the status bar (d-102). The taller rows and group headers make
  the list 12 px taller than the screen above the tab bar, so it scrolls
  (`hiddenOverflow` on `main.app-shell__detail`) where Figma's fits. The
  rules check fails on it until the library rows and group headers take Figma's heights (Library gap: Small text in the detail).
- **Button labels.** Newest and Filter take `Button textSize="sm"`
  (Medium 13, #105), as Figma draws them. The other labels are 14 px
  (`label`), where Figma sets small buttons in Medium 12 (no token,
  d-050), so those buttons are a little wider. Library gap: Button
  label size.

## Second review, round 2

A second blind review compared `frame.png` with the render (2026-11-17). Each finding, fixed or with why it stays:

- Search placeholder larger and lighter, chip counts lighter (P3): fixed in part by beta.5: the placeholder is 13 px and idle counts are `fg.subtle`; Figma's #4a5675 stays out by d-099 (fails WCAG AA, d-055).
