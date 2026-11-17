# T06 deviations

What still differs from Figma T6 · Inbox after starting a task (the list after starting a task, `runningList`), after the last
fidelity run (`pnpm fidelity inbox`, 2026-11-17, against the installed
library 1.0.0-beta.5, which has #104 to #106; no layer moved), each
with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass.
- Position: 5 of 9 layers pass (`header`, `filter · chips`, `list tools`, `group · NEEDS YOU`, `tab bar`).
- Rules: pass.

## Failing layers

Render minus Figma, in px. All three checks render the page 29 px
shorter, below Figma's status bar (d-102), and the position check adds
29 to each render y (d-101).

- `inbox list`: x +2, y +0, w -4, h +27.
- `group · NEXT STEPS`: x +2, y +18, w -4, h +4.
- `group · SNOOZED`: x +2, y +28, w -4, h +4.
- `group · RUNNING`: x +2, y +32, w -4, h +4.

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
- **List rows and group headers.** As in D01: `ListRow
  density="compact"` rows are 58 px against Figma's 55 and group
  headers 38 against 34 (4 px grid, d-072), so each later group starts
  lower. Library gap: Small text in the detail.
- **Tab bar.** `TabBar` spreads its five tabs over the full width
  (about 148 px each, Home at x 8); Figma centres five 91 px tabs from
  x 150 (346:5574). The bar itself (`tab bar`) is in place. Library gap:
  Tablet tab bar.
- **Button labels.** Newest and Filter use `Button textSize="sm"`
  (Medium 13), as Figma's (beta.5, #105). The row actions and other
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

A separate agent compared `frame.png` with the render, blind to how it
was built (2026-11-17). Each finding, fixed or with why it stays:

- Search placeholder larger and brighter than Figma's: stays.
  `SearchField` draws its text in `body` (14 px) at every size against
  Figma's 13 (library gap: Search field and chip count text, the same in
  D01 to D21). Its colour is `fg.subtle` #7986a6 against Figma's
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
  detail is T4's (`InboxRoute.test.tsx`).
