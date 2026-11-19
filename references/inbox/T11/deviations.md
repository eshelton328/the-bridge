# T11 deviations

What still differs from Figma T11 · Sorted by project (the list sorted by project, `sortedList`, the list of D11 `sortedByProject`), after the last
fidelity run (`pnpm fidelity inbox`, 2026-11-17, against the installed
library 1.0.0-beta.8, which adds #109), each
with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (62 strings).
- Position: 7 of 15 layers pass (`inbox list`, `header`, `filter · chips`, `list tools`, `group · NEEDS YOU`, `group · NEXT STEPS`, `tab bar`).
- Rules: pass.

## Failing layers

Render minus Figma, in px. All three checks render the page 29 px
shorter, below Figma's status bar (d-102), and the position check adds
29 to each render y (d-101).

- `group · SNOOZED`: x +2, y +6, w -4, h +2.
- `group · RUNNING`: x +2, y +8, w -4, h +2.

## Deviations

- **Status bar.** Figma draws a 29 px status bar (9:41) at the top of
  the frame; the app has none (d-089: device chrome belongs to the
  canvas). All three checks render the page 29 px shorter (d-102),
  so text under its bottom edge counts as not shown, and the position
  check adds 29 to each render y (d-101), so a layer anchored to the top or to the
  bottom compares true, and the side-by-side draws the render 29 px
  lower, under a blank band where Figma has the bar. Waiting for a design: Device chrome (d-089).
- **Side inset.** `Container size="tablet"` pads 24 against Figma's 22,
  so every full-width layer is `x +2, w -4` (within the tolerance).
- **List rows and group headers.** As in T01: `ListRow
  density="compact"` rows are 56 px against Figma's 55 and group
  headers 36 against 34, the 4 px grid values nearest Figma's (d-100,
  library #108).
- **Project headings.** Each project heading is the library's
  `GroupHeader variant="project"`, 24 px as Figma's (library #109,
  beta.8; was 26). With the 1 px taller rows and the 2 px taller group
  headers above, the later groups still start a little lower
  (`group · SNOOZED` y +6, `group · RUNNING` y +8); `group · NEXT
  STEPS` and the list's box (`inbox list`) are within the tolerance.
- **Tab bar.** The tabs are one centred group, 456 px wide from x 150
  (library #125, `TabBar size="tablet"`), and the bar (`tab bar`) is in
  place. Figma draws five tabs of 91.2 px with no Artifacts tab; the app
  draws six of 76, so `tab · Home`, `tab · Inbox`, `tab · Workspaces`,
  `tab · Projects` and `tab · More` are off in x and w (Home w -15.2,
  More x +15.2) and `tab · Artifacts` has no layer. The design predates
  d-105, which adds the Toolkit (and Artifacts) item; the app draws the
  six-item navigation.
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
- **Beta.8 (2026-11-17).** Library 1.0.0-beta.8 (#109) puts the project
  `GroupHeader` at Figma's 24 px (was 26), which moves these layers:
  `inbox list` within the tolerance (was x +2, y +0, w -4, h +7);
  `group · NEXT STEPS` within the tolerance (was y +6); `group ·
  SNOOZED` x +2, y +6, w -4, h +2 (was y +14); `group · RUNNING` x +2,
  y +8, w -4, h +2 (was y +16). The cause is 2 px less per project heading above each group.

## Second review

A separate agent compared the side-by-side picture with the render,
blind to how it was built (2026-11-17). Each finding, fixed or with why
it stays:

- The search icon and placeholder lighter and about 1 px larger (F1, F3), and the chip counts as bright as their labels (F2): stays. Former library gap: Search field and chip count text, closed by #106 and #107 (d-099 keeps the colours). (Beta.5 sets the placeholder at 13 px, `SearchField textSize="sm"`, and idle counts in `fg.subtle`; Figma's #4a5675 stays out by d-055 and d-099.)
- The chip row 2 px closer to the title (F4): stays. The header is 40 px high (`PageHeader size="phone"`, a 40 px line) against Figma's 42 (`header` h -2), so the chips start 2 px higher (`filter · chips` is within the tolerance). No token gives 42 (4 px grid, d-072). Library gap: Styles that differ from Figma.
