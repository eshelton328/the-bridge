# M16 deviations

What still differs from Figma M16 · Filtered (`filteredList`), after the last
fidelity run (`pnpm fidelity inbox`, 2026-11-17, library
1.0.0-beta.5, which adds #104 to #106), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: fail (56 strings checked; 1 Figma strings under exceptions.json). Not shown: `ncc-1701 · f-005 · NCC-28`, `quiet-nebula · Creating 9 issues…`, `Working`.
- Position: 6 of 11 layers pass (`header`, `filter · chips`, `list tools`, `filters applied`, `group · NEEDS YOU`, `tab bar`).
- Rules: pass (2 findings under exceptions.json).

## Failing layers

Render minus Figma, in px. All three checks render the page 38 px
shorter, below Figma's status bar (d-102), and the position check adds
38 to each render y (d-101).

- `inbox list`: x +0, y +0, w +0, h +24.
- `group · NEXT STEPS`: x +0, y +18, w +0, h +4.
- `group · SNOOZED`: x +0, y +25, w +0, h +4.
- `group · RUNNING`: x +0, y +29, w +0, h +4.
- `hidden count`: x +0, y +38, w -1.3, h +0.

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
  density="compact"` rows are 58 px against Figma's 55 and group
  headers 38 against 34 (4 px grid, d-072), so each later group starts
  lower and the list is taller (`inbox list` h). Library gap: Small
  text in the detail.
- **Header, chips and tools.** As in M01: `PageHeader size="phone"` is
  40 px high against Figma's 44 (`header` h -4) and the tools row 40
  against 44 (`list tools` h -4); the chip row's box is 34 against
  Figma's 30 (`filter · chips` h +4), so it and the first group start
  4 px higher. Library gap: Breakpoint tokens. The search field's text and placeholder are 13 px
  (`SearchField textSize="sm"`, `bodySm`), and an idle chip's count is
  `fg.subtle` (#7986a6, beta.5); Figma's #4a5675 stays out by d-099,
  because it fails WCAG AA (d-055).
- **Rows and chips on the phone.** As in M01: the rows are pulled 6 px
  out of the list's padding so the kind tiles line up under the group
  chevrons (Library gap: List row padding on the phone), and each chip
  pads its label 8 against Figma's 12 (Library gap: Filter chip padding
  on the phone).
- **Chip row.** The chips scroll sideways and the row clips them, as
  Figma does, and fades the cut edge over 24 px
  against Figma's 36 (the `hiddenOverflow`
  exception says why). Library gap: Chip row fade.
- **Filters that apply.** The Filter icon is pressed with its cyan dot
  (`Button indicator`), and the row under the tools lists Project with
  ncc-1701 and omni-brain, each with an x that removes it, and Clear.
  Each value is a pressed small `Button`, 28 px high against Figma's
  22 px chips (`filters applied` h +2). Library gap: Removable filter
  chip.
- **Hidden count.** "1 task hidden by filters" ends the list, under the
  tab bar, as in Figma; the taller rows and group headers above it put
  it lower (`hidden count` y +38). Figma's metadata gives the text by
  its layer name, and the exception says why.
- **Running row below the fold.** The checks render 806 px high, the
  screen below the status bar (d-102). The taller rows and group headers
  put the Running row 29 px lower than Figma's (`group · RUNNING` y +29),
  so its meta line (`ncc-1701 · f-005 · NCC-28`), chat line
  (`quiet-nebula · Creating 9 issues…`) and `Working` pill, which Figma
  shows above the tab bar, lie under it. The text check fails on them
  until the library rows and group headers take Figma's heights (Library gap: Small text in the detail).
- **Button labels.** Button labels are 14 px (`label`) at every size;
  Figma sets small buttons in Medium 12 or 13. Library gap: Button label
  size.
