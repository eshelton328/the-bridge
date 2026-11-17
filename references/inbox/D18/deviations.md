# D18 deviations

What still differs from Figma after round 3 of the fidelity loop
(`pnpm fidelity inbox D18`, 2026-11-16, against the installed
library 1.0.0-beta.3), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass; SNOOZED and its count, which the toast covers in Figma, are excepted in `exceptions.json`.
- Position: 9 of 17 layers pass (`inbox list`, `header`, `filter · chips`, `list tools`, `group · NEEDS YOU`, `toast · created`, `task pane`, `task bar`, `title block`).
- Rules: pass; the list pane's overflow is excepted in `exceptions.json` (see "List height").

## Deviations

- **List row heights.** Rows use `ListRow density="compact"` (#99):
  13 px titles (`labelSm`, 13/16) and 11 px mono meta (`monoSm`,
  11/16). A title and meta row is 58 px against Figma's 55: Figma's
  text boxes are 17 and 14 px high, and the library keeps line heights
  on the 4 px grid (d-072). Each group below the first starts lower (NEXT STEPS y +18, SNOOZED y +38).
- **Group headers.** 38 px high against Figma's 34 (`h +4` on each group
  header): the library's `GroupHeader` after the 4 px grid (#96).
- **New rows.** Figma draws the three new tasks as bordered boxes on a
  raised fill (403:2901). `ListRow` has no state for a new row (library
  gap); the rows are plain, with a `StatusPill tone="running"` "New" with
  a dot under the meta line, as Figma's pill.
- **Toast.** The library's `Toast tone="discuss"` with a check and Undo,
  12 px in and 16 px up from the list's bottom (`toast · created`
  passes).
- **List height.** With the taller rows the list is 10 px taller than
  the pane, so the pane scrolls and the collapsed SNOOZED header sits
  below its bottom edge. In Figma the toast covers that header (y 930,
  toast y 928 to 966), so it is out of sight in both. `exceptions.json`
  excepts the `hiddenOverflow` finding and SNOOZED and its count.
- **Detail text.** WHY and the prompt use `bodySm` (13/20), and the mono
  lines `monoSm` (11/16), as in D01 to D12. Figma's prompt lines are 21 px
  apart and its mono boxes 14 px high; the library keeps 20 and 16 (4 px
  grid). The prompt's five lines hold all of it, so it does not fade where
  Figma fades its fifth line (`section · SUGGESTED PROMPT` h +7).
- **Section gaps.** Sections are 24 px apart against Figma's 22; 22 has
  no spacing token and ties go to the larger (d-072). With the taller
  notes box (16 px, the `TextArea` field) the sections below WHY start
  lower: RUN IN y +19, start y +30, MY NOTES y +31, SOURCES y +49.
- **Detail inset.** The column starts at x 524 instead of 520 (`Container
  size="detail"` pads 40 where Figma has 36, d-072 tie). Within the 4 px
  tolerance.

## Second review

Not run by the builder; the coordinator runs the blind fidelity-reviewer
on `reports/fidelity/inbox/D18.sideBySide.png`.
