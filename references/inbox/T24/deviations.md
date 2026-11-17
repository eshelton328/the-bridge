# T24 deviations

What still differs from Figma T24 · Removed, in Done (`removedList`, D21's Done list on the tablet), after the last
fidelity run (`pnpm fidelity inbox`, all 70 frames, 2026-11-17,
against the installed library 1.0.0-beta.5, which has #104 to #106), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass.
- Position: 5 of 7 layers pass (`header`, `filter · chips`, `list tools`, `group · TODAY`, `tab bar`).
- Rules: pass.

## Failing layers

Render minus Figma, in px. All three checks render the page 29 px
shorter, below Figma's status bar (d-102), and the position check adds
29 to each render y (d-101).

- `inbox list`: x +2, y +0, w -4, h +12.
- `group · YESTERDAY`: x +2, y +12, w -4, h +4.

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
  as Figma's (402:12640). Idle chip counts are `fg.subtle` (#7986a6, #106);
  Figma's #4a5675 stays out by d-099, because it fails WCAG AA (d-055).
- **Done rows.** As in T07: the outcome lines are `small` (12/16)
  against Figma's Regular 11, and Figma fades the kind tiles of done
  rows (0.6), which no opacity token has. Library gaps: Small sans text
  for row lines, Styles that differ from Figma.
- **Tab bar.** `TabBar` spreads its five tabs over the full width
  (about 148 px each, Home at x 8); Figma centres five 91 px tabs from
  x 150. The bar itself (`tab bar`) is in place. Library gap: Tablet tab
  bar.
- **Button labels.** Newest and Filter take `Button textSize="sm"`
  (Medium 13, #105), as Figma draws them. The other labels are 14 px
  (`label`), where Figma sets small buttons in Medium 12 (no token,
  d-050), so those buttons are a little wider. Library gap: Button
  label size.

## Second review, round 2

A second blind review compared `frame.png` with the render (2026-11-17). Each finding, fixed or with why it stays:

- Chip counts lighter, search placeholder lighter and about 1 px larger (P3): fixed in part by beta.5: the placeholder is 13 px and idle counts are `fg.subtle`; Figma's #4a5675 stays out by d-099 (fails WCAG AA, d-055).
- Square corners where Figma's frame is rounded (P4): device chrome, which belongs to the canvas (d-089).
