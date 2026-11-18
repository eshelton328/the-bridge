# M04 deviations

What still differs from Figma after fix round 3 of the fidelity loop
(`pnpm fidelity artifacts M04`, 2026-11-18, against the installed library
1.0.0-beta.27; checked again 2026-11-18 with 1.0.0-beta.36), each with its
reason. The library gaps are in `web/src/pages/artifacts/LIBRARY_GAPS.md`.
M4 is M1's library on the phone with the Sort menu open as a sheet over
the tab bar (`SortSheet`, `LibraryTools sortAs="sheet"`); the library
under the scrim has M1's differences (`../M01/deviations.md`).

## Checks

- Text: passes.
- Position: 26 of 27 layers pass (`header`, `button · plus`,
  `list tools`, `search`, `button · Sort`, `button · Filter`,
  `found status`, both groups, the nine artifact rows, `tab bar`, the
  tab bar's five items, `sheet body` and `note`).
- Rules: pass. The scrolling pane is a `hiddenOverflow` exception
  (`exceptions.json`), as in M1 and M3: Figma's library runs to y 875,
  under the pinned tab bar, and the render scrolls the same way (d-107).

## Failing layers

Render minus Figma, in px. All three checks render the page 38 px
shorter, below Figma's status bar (d-102), and the position check adds
38 to each render y (d-101).

- `filter · chips`: x +0, y +0, w +4.2, h +2.

## Deviations

- **Source chips.** `filter · chips` w +4.2, as M1 and M3: the chips are
  6 apart against Figma's 5 (d-072), with Figma's 9 px sides. Library
  gap "Compact chip spacing".
- **Sort under the scrim.** The icon-only Sort has a cyan border under
  the scrim while the sheet is open; Figma draws it with the idle border,
  the same as Filter beside it (407:558, 407:563). `Button` draws an
  expanded trigger with `border.active`, and `BottomSheet` marks its
  trigger expanded. Library gap "Sheet trigger while open".
- **Rows under the scrim.** As M1: the previews are `Thumbnail size="md"`,
  76 × 48 as Figma's, but drawn as D2's row drawing scaled up, with window
  dots and smaller cells (library gap "Phone row preview drawing"), and
  the rows are 66 high and 2 apart, Figma's 68 px pitch (407:578; `ListRow
  padding="phone"` pads 8 inside the border, as Figma's), each 1 below
  Figma's, as in M1. New is `Badge size="xs"` with
  `SparkFilledIcon` at 8 px, within 1 px of Figma's 48 × 16; its filled
  star is 8 px against 9 (407:601, 407:602, the 4 px grid, d-100). The
  previews' colours differ as in M1 (library gap "Thumbnail colour").
- **Note.** The note under the sorts is `small` (12/16), 16 high against
  Figma's 17 (407:812), within the tolerance.
- **Device chrome.** The status bar (9:41), the home indicator (407:789)
  and the screen corners are not drawn (d-089); the checks measure the
  render 38 px shorter, under Figma's status bar (d-102).

## Values picked (d-100)

- Earlier's header (407:653) at y 500 against Figma's 501, as M1 (its
  36 px header starts right under Found's last row, so its label sits
  where Figma's 34 px header has it). The
  sheet's top edge is at y 517 (Figma 518, 407:814), so the sheet covers
  Earlier's label as Figma's does.
- Sort and Filter draw their icons in `fg.muted`, as Figma's grey.

- Choices: `OptionList size="sm"`, whose rows are 50 high and 2 apart
  with the text 12 in and the check 12 from the end, as Figma's
  (407:790 to 407:811); `sheet body` passes the position check.
- Sheet body: 8 under the note, as Figma's body (407:821 ends at 809, the
  note at 801), the same foot as the Filter sheet's body (T3).
- Focus: the sheet opens with the focus on the sheet itself, so no choice
  shows a focus ring, as Figma draws none.
- Sort: not pressed while the sheet is open, as Figma draws it (407:558);
  D6's desktop menu keeps its pressed Sort.
