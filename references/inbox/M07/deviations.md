# M07 deviations

What still differs from Figma M7 · Filter (the Filter sheet over the list, `filterList`), after the last
fidelity run (`pnpm fidelity inbox M07`, 2026-11-17, library
1.0.0-beta.4; updated on 2026-11-17 from `pnpm fidelity inbox` of all 70 frames against
the installed library 1.0.0-beta.5, which has #104 to #106), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (84 strings checked).
- Position: 5 of 9 layers pass (`header`, `filter · chips`, `list tools`, `group · NEEDS YOU`, `tab bar`).
- Rules: pass (1 findings under exceptions.json).

## Failing layers

Render minus Figma, in px. The position check renders the page 38 px
shorter, below Figma's status bar, and adds 38 to each render y (d-101).

- `inbox list`: x +0, y +0, w +0, h +19.
- `group · NEXT STEPS`: x +0, y +16, w +0, h +4.
- `group · SNOOZED`: x +0, y +29, w +0, h +4.
- `filter popover`: x +0, y -58, w +0, h +60.

## Deviations

- **Status bar.** Figma draws a 38 px status bar (9:41) at the top of
  the frame; the app has none (d-089: device chrome belongs to the
  canvas). The position check renders the page 38 px shorter and adds
  38 to each render y (d-101), so a layer anchored to the top or to the
  bottom compares true, and the side-by-side draws the render 38 px
  lower, under a blank band where Figma has the bar. Figma's home indicator (the bar at the bottom) and the frame's
  rounded corners are device chrome too (d-089): the render draws
  neither. Library gap:
  Top and bottom safe areas on the phone.
- **List rows and group headers.** As in D01 and T01: `ListRow
  density="compact"` rows are 58 px against Figma's 55 and group
  headers 38 against 34 (4 px grid, d-072), so each later group starts
  lower (`group · NEXT STEPS` y +16, `group · SNOOZED` y +29) and the
  list is taller (`inbox list` h +19).
  Library gap: Small text in the detail.
- **Header, chips and tools.** `PageHeader size="phone"` is 40 px high
  against Figma's 44 (`header` h -4) and the tools row 40 against 44
  (`list tools` h -4); the chip row's box is 34 against Figma's 30
  (`filter · chips` h +4), so it and `group · NEEDS YOU` start 4 px
  higher. The search field's text and placeholder
  are 13 px (`SearchField textSize="sm"`, `bodySm`, #106), as Figma's. An idle
  chip's count is `fg.subtle` (#7986a6, #106) against Figma's #4a5675,
  which stays out by d-099 because it fails WCAG AA (d-055).
  Library gap: Breakpoint tokens.
- **Row inset and title.** Figma's phone rows pad their content 4 at
  the sides (346:9052), so the kind tiles line up under the group
  chevrons; `ListRow` pads 10 inside a 1 px border. The phone pulls each
  row 6 px out of the list's padding, so the tile sits at x 17 against
  16 and the age ends at 373, as in Figma; the row's own box is 6 px
  wider each side, which shows only on a selected row. The large title
  sits 4 in from the header's edge (x 16), as in Figma. Library gap:
  List row padding on the phone.
- **Chip size.** Figma's phone chips pad their label 12 at the sides
  (`chip · All` 346:9014, 51 wide); `FilterChips size="compact"` pads
  8 with a 1 px border, as the tablet's chips (T1), so each chip is 6 px
  narrower and the row starts 2 px in. The gaps between the chips are 6,
  as in Figma. Library gap: Filter chip padding on the phone.
- **Chip row.** Figma's chip row runs past the list and scrolls
  sideways, the Done chip cut at the list's edge; the render does the
  same (the `hiddenOverflow` exception says why) and fades the
  cut edge over 24 px against Figma's 36. Library gap: Chip row fade.
- **Sort and Filter.** Icon buttons (`Button iconOnly`), 32 px square
  as in Figma (346:9036, 346:9041).
- **Filter sheet.** `BottomSheet` titled Filter with Clear, the Filter
  menu's boxes and Show 6 tasks, which closes the sheet and applies the
  boxes. The boxes are 32 px apart against Figma's 30 (as in D4 and
  T14) and the section labels are `GroupHeader`s, so the boxes run 60
  px taller (`filter popover` h +60) and the sheet starts higher
  (`filter popover` y -58). Clear shows the
  focus ring: the sheet focuses its first control. Library gaps: Styles
  that differ from Figma, Bottom sheet sections and data attribute.
- **Button labels.** Button labels are 14 px (`label`) here;
  Figma sets small buttons in Medium 12 or 13, which no text style has
  (d-050). `Button textSize="sm"` (Medium 13, #105) serves only the
  labels Figma sets in Medium 13 (Newest, Filter and the dialog's Keep
  it on the desktop and tablet). Library gap: Button label size.
