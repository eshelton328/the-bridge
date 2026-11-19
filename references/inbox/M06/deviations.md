# M06 deviations

What still differs from Figma M6 · Snooze or dismiss (the long-pressed row's actions sheet over the list, `rowActions`), after the last
fidelity run (`pnpm fidelity inbox M06`, 2026-11-17, library
1.0.0-beta.4; updated on 2026-11-17 from `pnpm fidelity inbox` of all 70 frames against
the installed library 1.0.0-beta.7, which has #107 and #108), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (61 strings checked; 2 Figma strings under exceptions.json).
- Position: 11 of 13 layers pass (`header`, `filter · chips`, `list tools`, `group · NEEDS YOU`, `group · NEXT STEPS`, `tab bar`).
  The shared navigation's items pass too: `tab · Home`, `tab · Inbox`,
  `tab · Workspaces`, `tab · Projects` and `tab · More`.
- Rules: pass (1 findings under exceptions.json).

## Failing layers

Render minus Figma, in px. All three checks render the page 38 px
shorter, below Figma's status bar (d-102), and the position check adds
38 to each render y (d-101).

- `inbox list`: x +0, y +0, w +0, h -7.
- `group · SNOOZED`: x +0, y +5, w +0, h +2.

## Deviations

- **Status bar.** Figma draws a 38 px status bar (9:41) at the top of
  the frame; the app has none (d-089: device chrome belongs to the
  canvas). All three checks render the page 38 px shorter (d-102),
  so text under its bottom edge counts as not shown, and the position
  check adds 38 to each render y (d-101), so a layer anchored to the top or to the
  bottom compares true, and the side-by-side draws the render 38 px
  lower, under a blank band where Figma has the bar. Figma's home indicator (the bar at the bottom) and the frame's
  rounded corners are device chrome too (d-089): the render draws
  neither. Waiting for a design: Device chrome (d-089).
- **List rows and group headers.** As in D01 and T01: `ListRow
  density="compact"` rows are 56 px against Figma's 55 and group
  headers 36 against 34, the 4 px grid values nearest Figma's (d-100,
  library #108), so each later group starts a little lower
  (`group · NEXT STEPS` within tolerance, `group · SNOOZED` y +5). The
  list's box ends 7 px above Figma's (`inbox list` h -7).
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
  chevrons; `ListRow padding="phoneSides"` (beta.78) pads 4 inside its 1 px
  border, so the tile sits at x 17 against 16 and the age ends at 373,
  as in Figma. The large title
  sits 4 in from the header's edge (x 16), as in Figma.
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
- **Actions sheet.** `BottomSheet` with the row's title, its meta and
  kind, the Snooze label, the times and Mark done and Dismiss as two
  `OptionList`s with a border between them. The rows are 38 px against
  Figma's 42 and their labels 14 px against 15, so the sheet is shorter
  and starts lower; Dismiss with a reason… is not red, and the held row
  behind the scrim is not lit (346:10097). The sheet itself has no
  `data-figma` (`BottomSheet` takes none), so the check does not measure
  it. Library gaps: Sheet action rows, Bottom sheet sections and data
  attribute. The second review sees the sheet rows' icons and times
  3 to 4 px further in than Figma's (the sheet's and the row's
  padding); the same gap.
- **Long-press.** Figma does not say how long a press opens the sheet;
  the render opens it after a touch held 500 ms, or on the context menu
  (right click, the menu key). "Pick a date and time…" only closes the
  sheet, and "Dismiss with a reason…" dismisses at once: Figma draws
  neither step yet.
- **Below the fold.** The checks render 806 px high (d-102). The list
  fits its viewport, as Figma's does (`main.app-shell__detail` does not
  scroll), so the rules check passes. The Snoozed header sits just above
  the tab bar, behind the sheet, where Figma's sheet covers it too (the
  exceptions say why).
- **Button labels.** The approval row's Allow once, Deny and Open chat
  are `Button textSize="xs"` (`labelXs`, Medium 12/16), as Figma's
  Medium 12 (d-100). Sort and Filter are icons. The labels match.
- **Beta.7 (2026-11-17).** Library 1.0.0-beta.6 and beta.7 (#107,
  #108) move these layers: `inbox list` x +0, y +0, w +0, h -7 (was x
  +0, y +0, w +0, h +19); `group · NEXT STEPS` within tolerance (was x
  +0, y +16, w +0, h +4); `group · SNOOZED` x +0, y +5, w +0, h +2
  (was x +0, y +29, w +0, h +4). The cause is #108's compact `ListRow`
  (56 px, was 58; Figma 55) and list `GroupHeader` (36 px, was 38;
  Figma 34).
