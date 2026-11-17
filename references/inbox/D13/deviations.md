# D13 deviations

What still differs from Figma after round 3 of the fidelity loop
(`pnpm fidelity inbox D13`, 2026-11-16, against the installed
library 1.0.0-beta.3), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass; the hidden Reset and Edit and the hidden-count layer name are excepted in `exceptions.json`.
- Position: 9 of 18 layers pass (`inbox list`, `header`, `filter · chips`, `list tools`, `filters applied`, `group · NEEDS YOU`, `task pane`, `task bar`, `title block`).
- Rules: pass.

## Deviations

- **List row heights.** Rows use `ListRow density="compact"` (#99):
  13 px titles (`labelSm`, 13/16) and 11 px mono meta (`monoSm`,
  11/16). A title and meta row is 58 px against Figma's 55: Figma's
  text boxes are 17 and 14 px high, and the library keeps line heights
  on the 4 px grid (d-072). Each group below the first starts lower (NEXT STEPS y +20, SNOOZED y +27, RUNNING y +31; the hidden-count line y +38).
- **Group headers.** 38 px high against Figma's 34 (`h +4` on each group
  header): the library's `GroupHeader` after the 4 px grid (#96).
- **Filters that apply.** The row (`filters applied`) passes. The library
  has no removable filter chip (Figma 359:993: 22 px high, `monoSm`, a
  cyan border and an x), so each value is a pressed `Button size="sm"`
  with a `CloseIcon`: 28 px high, in the button's `label` style. Clear is
  a link in `small` and `fg.accent`.
- **Filter · 1.** The Filter button shows the count and is pressed, as
  Figma's; Search narrows to make room for it, as in Figma.
- **Hidden count.** "1 task hidden by filters" in `small`, `fg.muted`.
  get_metadata gives the layer's name ("hidden count") as its text, so
  `exceptions.json` excepts the name and allows the text frame.png shows.
- **Detail text.** WHY and the prompt use `bodySm` (13/20), and the mono
  lines `monoSm` (11/16), as in D01 to D12. Figma's prompt lines are 21 px
  apart and its mono boxes 14 px high; the library keeps 20 and 16 (4 px
  grid). The prompt's five lines hold all of it, so it does not fade where
  Figma fades its fifth line (`section · SUGGESTED PROMPT` h +7).
- **Section gaps.** Sections are 24 px apart against Figma's 22; 22 has
  no spacing token and ties go to the larger (d-072). With the taller
  notes box (16 px, the `TextArea` field) the sections below WHY start
  lower: RUNNING CARD y +19, MY NOTES y +22, SOURCES y +40.
- **Detail inset.** The column starts at x 524 instead of 520 (`Container
  size="detail"` pads 40 where Figma has 36, d-072 tie). Within the 4 px
  tolerance.
- **Hidden Figma text.** Figma keeps Reset and Edit in the prompt header
  as hidden layers (a sent prompt is read-only); `exceptions.json`
  excepts them, as in D06.

## Second review

Not run by the builder; the coordinator runs the blind fidelity-reviewer
on `reports/fidelity/inbox/D13.sideBySide.png`.
