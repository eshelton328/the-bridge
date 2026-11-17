# M13 deviations

What still differs from Figma M13 · Sort (the Sort sheet over the list, `sortList`), after the last
fidelity run (`pnpm fidelity inbox`, 2026-11-17, library
1.0.0-beta.5, which adds #104 to #106), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (64 strings checked; 2 Figma strings under exceptions.json).
- Position: 5 of 9 layers pass (`header`, `filter · chips`, `list tools`, `group · NEEDS YOU`, `tab bar`).
- Rules: pass (2 findings under exceptions.json).

## Failing layers

Render minus Figma, in px. The position check renders the page 38 px
shorter, below Figma's status bar, and adds 38 to each render y (d-101).

- `inbox list`: x +0, y +0, w +0, h +25.
- `group · NEXT STEPS`: x +0, y +16, w +0, h +4.
- `group · SNOOZED`: x +0, y +26, w +0, h +4.
- `group · RUNNING`: x +0, y +30, w +0, h +4.

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
- **Sort sheet.** The phone's Sort is a `BottomSheet` titled Sort with
  Done, the four choices as an `OptionList` with the check on Newest
  first, and the note under a rule. A choice sorts the list and closes
  the sheet, from a tap or the keyboard (`InboxRoute.test.tsx`).
  Figma's choices are 58 px rows 2 apart; `OptionList` rows are 56 with
  no gap, so the sheet is a little shorter and starts lower. `BottomSheet`
  takes no `data-*` attribute, so the position check cannot measure the
  sheet. Done is `Button variant="text" size="sm"`, plain cyan text as
  Figma draws it, and the sheet opens with the focus on itself, so no
  focus ring shows (`InboxRoute.test.tsx`). The header is about 3 px
  taller than Figma's 40 (346:11808): "Sort" sits 39 below the sheet's
  top against 36, "Newest first" 81 against 78.
  Library gaps: Sort sheet rows, Bottom sheet sections and data
  attribute.
- **Sort button.** While the sheet is open the Sort icon shows pressed
  (cyan), as on the tablet (T9); Figma dims it under the scrim.
- **Running row.** As in M11, its chat line and Working pill lie under
  the tab bar in Figma and in the render (the exceptions say why).
- **Button labels.** Button labels are 14 px (`label`) at every size;
  Figma sets small buttons in Medium 12 or 13. Library gap: Button label
  size.
