# T11 deviations

What still differs from Figma T11 · Sorted by project (the list sorted by project, `sortedList`, the list of D11 `sortedByProject`), after the last
fidelity run (`pnpm fidelity inbox`, 2026-11-17, against the installed
library 1.0.0-beta.5, which has #104 to #106; no layer moved), each
with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (62 strings).
- Position: 5 of 9 layers pass (`header`, `filter · chips`, `list tools`, `group · NEEDS YOU`, `tab bar`).
- Rules: pass.

## Failing layers

Render minus Figma, in px. All three checks render the page 29 px
shorter, below Figma's status bar (d-102), and the position check adds
29 to each render y (d-101).

- `inbox list`: x +2, y +0, w -4, h +37.
- `group · NEXT STEPS`: x +2, y +22, w -4, h +4.
- `group · SNOOZED`: x +2, y +36, w -4, h +4.
- `group · RUNNING`: x +2, y +40, w -4, h +4.

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
  lower and the list is taller (`inbox list` h). Library gap: Small text
  in the detail.
- **Project headings.** Each project heading is the library's
  `GroupHeader variant="project"`, taller than Figma's (#96 rows on the 4
  px grid), so each later group starts lower (`group · SNOOZED`,
  `group · RUNNING`). Library gap: Styles that differ from Figma.
- **Tab bar.** `TabBar` spreads its five tabs over the full width;
  Figma centres five 91 px tabs. The bar itself (`tab bar`) is in place.
  Library gap: Tablet tab bar.
- **Button labels.** Sort (here "Project") and Filter use
  `Button textSize="sm"` (Medium 13), as Figma's Newest and Filter
  (beta.5, #105). The row actions and other
  small buttons keep the 14 px `label`; Figma sets them in Medium 12,
  which no text style has (d-050), so they are a little wider. Library
  gap: Button label size.
- **Search field and chip counts.** The search field sets its text and
  placeholder in `bodySm` (13 px, `SearchField textSize="sm"`), as
  Figma's. The placeholder stays `fg.subtle` #7986a6 against Figma's
  #4a5675 by d-055. Idle filter chip counts are `fg.subtle` (#7986a6,
  #106); Figma's #4a5675 stays out by d-099, because it fails WCAG AA
  (d-055).

## Second review

A separate agent compared the side-by-side picture with the render,
blind to how it was built (2026-11-17). Each finding, fixed or with why
it stays:

- The search icon and placeholder lighter and about 1 px larger (F1, F3), and the chip counts as bright as their labels (F2): stays. Library gap: Search field and chip count text. (Beta.5 sets the placeholder at 13 px, `SearchField textSize="sm"`, and idle counts in `fg.subtle`; Figma's #4a5675 stays out by d-055 and d-099.)
- The chip row 2 px closer to the title (F4): stays. The header is 40 px high (`PageHeader size="phone"`, a 40 px line) against Figma's 42 (`header` h -2), so the chips start 2 px higher (`filter · chips` is within the tolerance). No token gives 42 (4 px grid, d-072). Library gap: Styles that differ from Figma.
