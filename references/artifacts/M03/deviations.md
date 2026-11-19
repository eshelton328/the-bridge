# M03 deviations

What still differs from Figma after fix round 2 of the fidelity loop
(`pnpm fidelity artifacts M03`, 2026-11-18, against the installed library
1.0.0-beta.27; checked again 2026-11-18 with 1.0.0-beta.36 and 2026-11-19
with 1.0.0-beta.80), each with its
reason. The library gaps are in `web/src/pages/artifacts/LIBRARY_GAPS.md`.
M3 is M1's library on the phone with T3's Filter sheet open over the tab
bar (`FilterSheet iconOnly`); the library under the scrim has M1's
differences (`../M01/deviations.md`), and the sheet has T3's
(`../T03/deviations.md`).

## Checks

- Text: passes. The Brain map prototype row (407:231) lies under the tab
  bar and the sheet in Figma and in the render.
- Position: 42 of 44 layers pass (`header`, `button · plus`,
  `list tools`, `search`, `button · Sort`, `button · Filter`,
  `found status`, both groups, the nine artifact rows, `tab bar`, the
  tab bar's five items, `sheet body`, the four section labels, every
  row but `check · Artifact hook`, the footer `407:501` and
  `button · Show 7 artifacts`); 29 passed before library 1.0.0-beta.80.
- Rules: pass. The scrolling pane is a `hiddenOverflow` exception
  (`exceptions.json`), as in M1: Figma's library runs to y 875, under the
  pinned tab bar, and the render scrolls the same way (d-107).

## Deviations

- **Filter sheet rows.** As T3: since library 1.0.0-beta.80 the rows are
  28 high and 30 apart, as Figma's, and the sheet's body passes. Still
  open: each section label is a 30 px `GroupHeader variant="sidebar"` row
  against Figma's 26, so `check · Artifact hook` sits 5 low (y +5).
  Library gap "Filter sheet section labels".
- **Source marks.** The Claude artifacts and Codex sites rows draw the
  Claude and Codex marks between the box and the label (407:290, 407:300)
  with `Checkbox leading` and `KindMark size="12"` (library
  1.0.0-beta.80), 12 px against Figma's 13.
- **Source chips.** `filter · chips` w +4.2, as M1: the chips are 6 apart
  against Figma's 5 (d-072), with Figma's 9 px sides. Library gap
  "Compact chip spacing".
- **Rows under the scrim.** As M1: the previews are `Thumbnail size="md"`,
  76 × 48 as Figma's, drawn as Figma's phone row drawings since library
  1.0.0-beta.71 (library PR 221), with M1's small remaining differences, and
  the rows are 66 high and 2 apart, Figma's 68 px pitch (407:76; `ListRow
  padding="phone"` pads 8 inside the border, as Figma's), each 1 below
  Figma's, as in M1. New is `Badge size="xs"` with
  `SparkFilledIcon` at 8 px, within 1 px of Figma's 48 × 16; its filled
  star is 8 px against 9 (407:99, 407:100, the 4 px grid, d-100). The
  previews' colours differ as in M1 (library gap "Thumbnail colour").
- **Show 7 artifacts.** The label is the primary button's Medium; Figma's
  looks a little heavier, as T3.
- **Device chrome.** The status bar (9:41), the home indicator (407:287)
  and the screen corners are not drawn (d-089); the checks measure the
  render 38 px shorter, under Figma's status bar (d-102).

## Values picked (d-100)

- Sheet, section rows, Show and focus: T3's (`../T03/deviations.md`); M3's
  sheet has T3's insets (407:399 to 407:502).
- Filter: M1's 36 px icon-only button, pressed while the sheet is open,
  with no dot, as Figma draws it (407:61); its icon stays `fg.muted`
  while pressed, as Figma's.
- Clear: the `text` Button reaches 8 past the title row's end, so its
  label ends 1 px inside Figma's (407:405 ends at x 373).
