# M12 deviations

What still differs from Figma M12 · Done (`doneList`), after the last
fidelity run (`pnpm fidelity inbox M12`, 2026-11-17, library
1.0.0-beta.4; updated on 2026-11-17 from `pnpm fidelity inbox` of all 70 frames against
the installed library 1.0.0-beta.7, which has #107 and #108), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (39 strings checked).
- Position: 11 of 12 layers pass (`header`, `filter · chips`, `list tools`, `group · TODAY`, `group · YESTERDAY`, `tab bar`).
  The shared navigation's items pass too: `tab · Home`, `tab · Inbox`,
  `tab · Workspaces`, `tab · Projects` and `tab · More`.
- Rules: pass (1 findings under exceptions.json).

## Failing layers

Render minus Figma, in px. All three checks render the page 38 px
shorter, below Figma's status bar (d-102), and the position check adds
38 to each render y (d-101).

- `inbox list`: x +0, y +0, w +0, h -10.

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
  library #108), so `group · YESTERDAY` starts within tolerance of
  Figma's. The list's box ends 10 px above Figma's (`inbox list`
  h -10).
- **Header, chips and tools.** As in M01: `PageHeader size="phone"` is
  40 px high against Figma's 44 (`header` h -4) and the tools row 40
  against 44 (`list tools` h -4); the chip row's box is 34 against
  Figma's 30 (`filter · chips` h +4), so it and `group · TODAY` start
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
  Figma does (the `hiddenOverflow` exception says why). With Done
  selected Figma scrolls All (346:11406) wholly off the left edge under
  its fade. The render's chips pad 8 against 12, so the row (40 px narrower
  than Figma's) overflows the list by less than All's width: scrolled to
  its end it still shows about 24 px of All, its count "7" among them, under the library's 24 px fade
  (the second review reads the "7"). No scroll position hides it; the
  12 px chip padding would. Library gaps: Chip row fade, Filter chip
  padding on the phone.
- **Selected chip.** With Done selected, the chip row scrolls Done into
  view and All off to the left, as Figma draws it. `FilterChips` scrolls
  a chip into view only when it takes the focus, so `InboxListPane`
  scrolls the selected chip into view when the filter changes
  (`InboxRoute.test.tsx`). Library gap: Selected chip in view.
- **Finished rows.** Each row says how it ended, in green or grey. The
  outcome line is `small` (13 px) against Figma's Regular 12, and the
  titles keep the default colour where Figma dims them a step. Library
  gaps: Small sans text for row lines, Styles that differ from Figma.
  Each kind tile fades to `opacity.finished` 0.75 against Figma's 0.6
  (library #107): at 0.6 the icons fall to 2.4:1 in light mode, under
  WCAG AA's 3:1 (d-100).
  A finished row has no actions, so it has no long-press; it still sits
  in line with the other phone rows.
- **Beta.7 (2026-11-17).** Library 1.0.0-beta.6 and beta.7 (#107,
  #108) move these layers: `inbox list` x +0, y +0, w +0, h -10 (was x
  +0, y +0, w +0, h +10); `group · YESTERDAY` within tolerance (was x
  +0, y +10, w +0, h +4). The cause is #108's compact `ListRow` (56
  px, was 58; Figma 55) and list `GroupHeader` (36 px, was 38; Figma
  34).
