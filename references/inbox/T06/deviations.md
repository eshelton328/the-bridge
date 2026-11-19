# T06 deviations

What still differs from Figma T6 · Inbox after starting a task (the list after starting a task, `runningList`), after the last
fidelity run (`pnpm fidelity inbox`, 2026-11-17, against the installed
library 1.0.0-beta.7, which has #107 and #108; no layer moved), each
with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass.
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
- **List rows and group headers.** As in D01: `ListRow
  density="compact"` rows are 56 px against Figma's 55 and group
  headers 36 against 34, the 4 px grid values nearest Figma's (d-100,
  library #108), so each later group starts a little lower
  (`group · SNOOZED` y +6, `group · RUNNING` y +8).
- **Tab bar.** The tabs are one centred group, 456 px wide from x 150
  (library #125, `TabBar size="tablet"`), and the bar (`tab bar`) is in
  place. Figma draws five tabs of 91.2 px with no Artifacts tab; the app
  draws six of 76, so `tab · Home`, `tab · Inbox`, `tab · Workspaces`,
  `tab · Projects` and `tab · More` are off in x and w (Home w -15.2,
  More x +15.2) and `tab · Artifacts` has no layer. The design predates
  d-105, which adds the Toolkit (and Artifacts) item; the app draws the
  six-item navigation.
- **Button labels.** Newest and Filter use `Button textSize="sm"`
  (Medium 13), as Figma's (beta.5, #105). The approval row's Allow
  once, Deny and Open chat take `textSize="xs"` (`labelXs`, Medium
  12/16), Figma's Medium 12 (d-100). The labels match Figma's.
- **Search field and chip counts.** The search field sets its text and
  placeholder in `bodySm` (13 px, `SearchField textSize="sm"`), as
  Figma's. The placeholder stays `fg.subtle` #7986a6 against Figma's
  #4a5675 by d-055. Idle filter chip counts are `fg.subtle` (#7986a6,
  #106); Figma's #4a5675 stays out by d-099, because it fails WCAG AA
  (d-055).
- **Beta.7 (2026-11-17).** Library 1.0.0-beta.6 and beta.7 (#107,
  #108) move these layers: `inbox list` within tolerance (was x +2, y
  +0, w -4, h +27); `group · NEXT STEPS` within tolerance (was x +2, y
  +18, w -4, h +4); `group · SNOOZED` x +2, y +6, w -4, h +2 (was x
  +2, y +28, w -4, h +4); `group · RUNNING` x +2, y +8, w -4, h +2
  (was x +2, y +32, w -4, h +4). The cause is #108's compact `ListRow`
  (56 px, was 58; Figma 55) and list `GroupHeader` (36 px, was 38;
  Figma 34).

## Second review

A separate agent compared `frame.png` with the render, blind to how it
was built (2026-11-17). Each finding, fixed or with why it stays:

- Search placeholder larger and brighter than Figma's: stays.
  `SearchField` draws its text in `body` (14 px) at every size against
  Figma's 13 (then a library gap, the same in D01 to D21; closed by #106). Its colour is `fg.subtle` #7986a6 against Figma's
  #4a5675 by d-055.
  (Fixed by beta.5: `SearchField textSize="sm"` sets the text and
  placeholder in `bodySm`, 13 px; the colour stays by d-055.)
- Filter chip counts as bright as their labels: stays. `FilterChips`
  draws counts in `fg.muted`; Figma draws them in #4a5675 (same library
  gap, the same in D01 to D21).
  (Beta.5 draws idle counts in `fg.subtle`, #7986a6; Figma's #4a5675
  stays out by d-099.)

## Running row

- **Running row.** A tap on the task under Running opens its task page
  (T4, M10), as the M10, T4 and D6 notes say, not the chat: the state's
  detail is T4's (the Inbox route tests).
