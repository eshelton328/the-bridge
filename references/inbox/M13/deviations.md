# M13 deviations

What still differs from Figma M13 · Sort (the Sort sheet over the list, `sortList`), after the last
fidelity run (`pnpm fidelity inbox`, 2026-11-17, library
1.0.0-beta.7, which adds #107 and #108), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (64 strings checked; 2 Figma strings under exceptions.json).
- Position: 12 of 14 layers pass (`header`, `filter · chips`, `list tools`, `group · NEEDS YOU`, `group · NEXT STEPS`, `group · SNOOZED`, `tab bar`).
  The shared navigation's items pass too: `tab · Home`, `tab · Inbox`,
  `tab · Workspaces`, `tab · Projects` and `tab · More`.
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
  the sheet, from a tap or the keyboard (the Inbox route tests).
  Figma's choices are 58 px rows 2 apart; `OptionList` rows are 56 with
  no gap, so the sheet is a little shorter and starts lower. `BottomSheet`
  takes no `data-*` attribute, so the position check cannot measure the
  sheet. Done is `Button variant="text" size="sm"`, plain cyan text as
  Figma draws it, and the sheet opens with the focus on itself, so no
  focus ring shows (the Inbox route tests). The header is about 3 px
  taller than Figma's 40 (346:11808): "Sort" sits 39 below the sheet's
  top against 36, "Newest first" 81 against 78.
  Library gaps: Sort sheet rows, Bottom sheet sections and data
  attribute.
- **Sort button.** While the sheet is open the Sort icon shows pressed
  (cyan), as on the tablet (T9); Figma dims it under the scrim.
- **Running row.** As in M11, its meta line, chat line and Working pill
  lie under the tab bar in Figma and in the render; the list runs under
  the bar (AppShell `tabBarOverlay`), so the text check passes them with
  no exception.
- **Running row under the sheet.** The checks render 806 px high
  (d-102). The Running row lies under the Sort sheet in Figma and in the
  render (the exceptions say why).
- **Button labels.** The approval row's Allow once, Deny and Open chat
  are `Button textSize="xs"` (`labelXs`, Medium 12/16), as Figma's
  Medium 12 (d-100). Sort and Filter are icons, and the sheet's Done
  keeps the default label of `size="sm"`. No label in this frame is open
  in the library.
- **Beta.7 (2026-11-17).** Library 1.0.0-beta.6 and beta.7 (#107,
  #108) move these layers: `inbox list` x +0, y +0, w +0, h -5 (was x
  +0, y +0, w +0, h +25); `group · NEXT STEPS` within tolerance (was x
  +0, y +16, w +0, h +4); `group · SNOOZED` within tolerance (was x
  +0, y +26, w +0, h +4); `group · RUNNING` x +0, y +6, w +0, h +2
  (was x +0, y +30, w +0, h +4). The cause is #108's compact `ListRow`
  (56 px, was 58; Figma 55) and list `GroupHeader` (36 px, was 38;
  Figma 34).
