# M11 deviations

What still differs from Figma M11 · Inbox after starting a task (`runningList`), after the last
fidelity run (`pnpm fidelity inbox M11`, 2026-11-17, library
1.0.0-beta.4; updated on 2026-11-17 from `pnpm fidelity inbox` of all 70 frames against
the installed library 1.0.0-beta.7, which has #107 and #108), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (52 strings checked; 3 Figma strings under exceptions.json).
- Position: 7 of 9 layers pass (`header`, `filter · chips`, `list tools`, `group · NEEDS YOU`, `group · NEXT STEPS`, `group · SNOOZED`, `tab bar`).
- Rules: pass (2 findings under exceptions.json).

## Failing layers

Render minus Figma, in px. All three checks render the page 38 px
shorter, below Figma's status bar (d-102), and the position check adds
38 to each render y (d-101).

- `inbox list`: x +0, y +0, w +0, h -5.
- `group · RUNNING`: x +0, y +6, w +0, h +2.

## Deviations

- **Status bar.** Figma draws a 38 px status bar (9:41) at the top of
  the frame; the app has none (d-089: device chrome belongs to the
  canvas). All three checks render the page 38 px shorter (d-102),
  so text under its bottom edge counts as not shown, and the position
  check adds 38 to each render y (d-101), so a layer anchored to the top or to the
  bottom compares true, and the side-by-side draws the render 38 px
  lower, under a blank band where Figma has the bar. Figma's home indicator (the bar at the bottom) and the frame's
  rounded corners are device chrome too (d-089): the render draws
  neither. Library gap:
  Top and bottom safe areas on the phone.
- **List rows and group headers.** As in M01: `ListRow
  density="compact"` rows are 56 px against Figma's 55 and group
  headers 36 against 34, the 4 px grid values nearest Figma's (d-100,
  library #108), so each later group starts a little lower (Next steps
  and Snoozed within tolerance, `group · RUNNING` y +6). The list's box
  ends 5 px above Figma's (`inbox list` h -5).
- **Header, chips and tools.** As in M01: `PageHeader size="phone"` is
  40 px high against Figma's 44 (`header` h -4) and the tools row 40
  against 44 (`list tools` h -4); the chip row's box is 34 against
  Figma's 30 (`filter · chips` h +4), so it and the first group start
  4 px higher. The search field's text and placeholder
  are 13 px (`SearchField textSize="sm"`, `bodySm`, #106), as Figma's. An idle
  chip's count is `fg.subtle` (#7986a6, #106) against Figma's #4a5675,
  which stays out by d-099 because it fails WCAG AA (d-055).
  Library gap: Breakpoint tokens.
- **Rows and chips on the phone.** As in M01: the rows are pulled 6 px
  out of the list's padding so the kind tiles line up under the group
  chevrons (Library gap: List row padding on the phone), and each chip
  pads its label 8 against Figma's 12 (Library gap: Filter chip padding
  on the phone).
- **Chip row.** The chips scroll sideways and the row clips them, as
  Figma does, and fades the cut edge over 24 px
  against Figma's 36 (the `hiddenOverflow`
  exception says why). Library gap: Chip row fade.
- **Running row.** The started task sits under Running at the bottom,
  as Figma draws it, with its chat line and Working pill; both lie
  partly or wholly under the tab bar in Figma and in the render (the
  exceptions say why). Pills are 22 px against Figma's 20. Library gap:
  Pill height.
- **Sort and Filter.** Icon buttons (`Button iconOnly`), 32 px square.
- **Running row below the fold.** The checks render 806 px high, the
  screen below the status bar (d-102). The Running group starts 6 px
  lower than Figma's (`group · RUNNING` y +6), and its row's title
  (`Write the tickets for increment one`) and age (`2h`) show above the
  tab bar, as in Figma, so the text check passes. Its subtitle runs under
  the tab bar in Figma too (the exception says why).
- **Button labels.** The approval row's Allow once, Deny and Open chat
  are `Button textSize="xs"` (`labelXs`, Medium 12/16), as Figma's
  Medium 12 (d-100). Sort and Filter are icons. The labels match.
- **Running row.** A tap on the task under Running opens its task page
  (T4, M10), as the M10, T4 and D6 notes say, not the chat: the state's
  detail is T4's (`InboxRoute.test.tsx`).
- **Beta.7 (2026-11-17).** Library 1.0.0-beta.6 and beta.7 (#107,
  #108) move these layers: `inbox list` x +0, y +0, w +0, h -5 (was x
  +0, y +0, w +0, h +25); `group · NEXT STEPS` within tolerance (was x
  +0, y +16, w +0, h +4); `group · SNOOZED` within tolerance (was x
  +0, y +26, w +0, h +4); `group · RUNNING` x +0, y +6, w +0, h +2
  (was x +0, y +30, w +0, h +4). The cause is #108's compact `ListRow`
  (56 px, was 58; Figma 55) and list `GroupHeader` (36 px, was 38;
  Figma 34).
