# T11 deviations

What still differs from Figma T11 · Sorted by project (the list sorted by project, `sortedList`, the list of D11 `sortedByProject`), after the last
fidelity run (`pnpm fidelity inbox`, 2026-11-17, against the installed
library 1.0.0-beta.7, which has #107 and #108; no layer moved), each
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

- `inbox list`: x +2, y +0, w -4, h +7.
- `group · NEXT STEPS`: x +2, y +6, w -4, h +2.
- `group · SNOOZED`: x +2, y +14, w -4, h +2.
- `group · RUNNING`: x +2, y +16, w -4, h +2.

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
  library #108).
- **Project headings.** Each project heading is the library's
  `GroupHeader variant="project"`, 26 px against Figma's 24 (#96 rows
  on the 4 px grid; #108 left it as it was). With the rows and group
  headers above, each later group starts lower (`group · NEXT STEPS`
  y +6, `group · SNOOZED` y +14, `group · RUNNING` y +16) and the
  list is 7 px taller than Figma's (`inbox list` h +7). Library gap:
  Styles that differ from Figma.
- **Tab bar.** `TabBar` spreads its five tabs over the full width;
  Figma centres five 91 px tabs. The bar itself (`tab bar`) is in place.
  Library gap: Tablet tab bar.
- **Button labels.** Sort (here "Project") and Filter use
  `Button textSize="sm"` (Medium 13), as Figma's Newest and Filter
  (beta.5, #105). The approval row's Allow once, Deny and Open chat
  take `textSize="xs"` (`labelXs`, Medium 12/16), Figma's Medium 12
  (d-100). The labels match Figma's.
- **Search field and chip counts.** The search field sets its text and
  placeholder in `bodySm` (13 px, `SearchField textSize="sm"`), as
  Figma's. The placeholder stays `fg.subtle` #7986a6 against Figma's
  #4a5675 by d-055. Idle filter chip counts are `fg.subtle` (#7986a6,
  #106); Figma's #4a5675 stays out by d-099, because it fails WCAG AA
  (d-055).
- **Beta.7 (2026-11-17).** Library 1.0.0-beta.6 and beta.7 (#107,
  #108) move these layers: `inbox list` x +2, y +0, w -4, h +7 (was x
  +2, y +0, w -4, h +37); `group · NEXT STEPS` x +2, y +6, w -4, h +2
  (was x +2, y +22, w -4, h +4); `group · SNOOZED` x +2, y +14, w -4,
  h +2 (was x +2, y +36, w -4, h +4); `group · RUNNING` x +2, y +16, w
  -4, h +2 (was x +2, y +40, w -4, h +4). The cause is #108's compact
  `ListRow` (56 px, was 58; Figma 55) and list `GroupHeader` (36 px,
  was 38; Figma 34).

## Second review

A separate agent compared the side-by-side picture with the render,
blind to how it was built (2026-11-17). Each finding, fixed or with why
it stays:

- The search icon and placeholder lighter and about 1 px larger (F1, F3), and the chip counts as bright as their labels (F2): stays. Former library gap: Search field and chip count text, closed by #106 and #107 (d-099 keeps the colours). (Beta.5 sets the placeholder at 13 px, `SearchField textSize="sm"`, and idle counts in `fg.subtle`; Figma's #4a5675 stays out by d-055 and d-099.)
- The chip row 2 px closer to the title (F4): stays. The header is 40 px high (`PageHeader size="phone"`, a 40 px line) against Figma's 42 (`header` h -2), so the chips start 2 px higher (`filter · chips` is within the tolerance). No token gives 42 (4 px grid, d-072). Library gap: Styles that differ from Figma.
