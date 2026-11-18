# T03 deviations

What still differs from Figma after round 3 of the fidelity loop
(`pnpm fidelity artifacts T03`, 2026-11-17, against the installed
library 1.0.0-beta.19), each with its reason. The library gaps are in
`web/src/pages/artifacts/LIBRARY_GAPS.md`. T3 is T1's library on the
iPad mini with the Filter menu open as a sheet over the tab bar; the
library under the scrim has T1's differences (`../T01/deviations.md`),
and the sheet's rows have D3's (`../D03/deviations.md`).

## Checks

- Text: passes, as T1: Hono server spike's description (407:1376) shows
  whole. The four strings of the third card row's body (407:1433,
  407:1434, 407:1457, 407:1458) lie under the tab bar and the sheet in
  Figma and in the render, and the Tailscale description (414:711) lies
  under the sheet; they are `missing` exceptions (`exceptions.json`), as
  in T1.
- Position: 17 of 37 layers pass (`header`, `found status`, `list tools`,
  both groups, the six cards, `tab bar`,
  `group · UPDATED`, `check · Today`, `check · This week`, the footer
  `407:1719` and `button · Show 7 artifacts`).
- Rules: pass, as T1. The scrolling pane and the two cut descriptions
  under the sheet (Tailscale, versioning) are `hiddenOverflow`
  exceptions, as in T1.

## Deviations

- **Filter sheet rows.** `sheet body` y -24, h +26, and the rows above
  Updated: `group · SOURCE` y -24, `check · Claude artifacts` y -22,
  `check · Codex sites` y -21, `group · PROJECT` y -20,
  `check · ncc-1701` y -18, `check · omni` y -16,
  `check · skill-evals` y -14, `check · omni-brain` y -12,
  `check · Not in a project` y -10, `group · FOUND BY` y -9,
  `check · Artifact hook` y -7, `check · Codex session log` y -6 and
  `check · Added by hand` y -5. The `Checkbox` rows are 32 high and 32
  apart against Figma's 29 (28 for a mono label) and 31 or 30, and each
  section label is a 30 px `GroupHeader variant="sidebar"` row against
  Figma's 26, so the sheet's body is 512 high against 486. The sheet
  keeps its bottom where Figma has it (Show and the rows of Updated pass),
  so its top, the grabber, the title row and the first rows sit up to
  24 px higher, and the sheet covers 24 px more of the two cards above
  it. Library gap "Filter menu rows and inset".
- **Source marks.** The Claude artifacts and Codex sites rows have no
  Claude or Codex mark between the box and the label (407:1508,
  407:1518): `Checkbox` takes only a text label. Library gap "Checkbox
  leading icon".
- **Search, Sort, Filter and Add a link.** `search` w -20.8,
  `button · Sort` x -22.8, w +16.4, `button · Filter` x -6.4, w +12.4,
  `button · Add a link` x -7.2, w +9.2, as T1: the library's 36 px
  `size="lg"` buttons pad 16 at the sides against Figma's 11, so each is
  wider and the search narrower. Filter shows no dot while the sheet is
  open, as Figma draws it (407:1303); it shows the dot once the sheet
  closes on checked boxes. Library gap "Sort and Filter button widths".
- **Source chips.** `filter · chips` w +4.2, as T1: the chips are 6 apart
  with 8 px sides against Figma's 5 and 9. Library gap "Compact chip
  spacing".
- **Grid or List and cards.** `view · Grid or List` x +6, as T1: the
  68 px `ViewSwitch` (Figma 72) ends at the page's 20 px side. The cards
  are 352 wide, 20 in and 12 apart (Figma 349, 22 and 14, d-100), so the
  descriptions break where Figma's do. Library gaps "Sort and Filter
  button widths" and "Card body and line heights".
- **New badge, page title and thumbnails.** As T1, under the scrim: New
  sits 8 px after the card title, not at the end of the row; "Artifacts"
  uses the phone title size (28 px type), a little smaller than Figma's;
  the chart bars are a brighter cyan and the ui preview draws lines where
  Figma has a plain panel. Library gaps "Card badge at the end of the
  title row", "Desktop page title size" and "Thumbnail colour".
- **Show 7 artifacts.** The label is the primary button's Medium; Figma's
  looks a little heavier. The button is 46 high in Figma (407:1720) and
  `size="xl"` matches it within the tolerance, as the Inbox's M7 sheet.
- **Tab bar.** As T1: the shared tab bar (`AppTabBar device="tablet"`,
  not changed here: a library change for it is in progress) spreads its
  six tabs over the full width; Figma groups them, 76 wide each, in the
  middle (407:1466 to 407:1496, x 150 to 606). The scrim and the sheet
  cover it in both; the `tab bar` box itself matches.
- **Device chrome.** The status bar (9:41), the home indicator (407:1504)
  and the screen corners are not drawn (d-089); the checks measure the
  render 29 px shorter, under Figma's status bar (d-102).

## Values picked (d-100)

- Sheet: the library `BottomSheet` (13 px inset in its 1 px border, the
  grabber 9 down, a 40 px title row with a 17 px title and Clear as a
  `variant="text" size="sm"` button), as Figma's (407:1618 to 407:1623).
- Section label rows: `GroupHeader variant="sidebar"` (8 above the text,
  as Figma's 407:1507), padded 4 more at the start so the labels start
  8 in from the sheet's inset, as Figma's x 21.
- Under the boxes: 8 (`spacing.8`), Figma's value (the sheet body ends 8
  after its last row, 407:1624); Show 8 under it and 4 in at the sides
  (`spacing.8`, `spacing.4`), Figma's values (407:1719).
- Focus: the sheet opens with the focus on itself, as Figma draws Clear
  with no focus ring.
