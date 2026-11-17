# D04 deviations

What still differs from Figma after round 5 of the fidelity loop
(`pnpm fidelity inbox D04`, 2026-11-16, against the installed
library 1.0.0-beta.2, which has #97 to #101), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass. The text check of main 3546ac7 (#3) skips the values of
  radio, checkbox, hidden and password inputs, so the option ids inside
  `Checkbox` rows no longer count as visible text.
  The hidden "Run the readme" row is excepted in `exceptions.json`.
- Position: 8 of 16 layers pass (`inbox list`, `header`, `filter · chips`, `list tools`, `group · NEEDS YOU`, `task pane`, `task bar`, `title block`).
- Rules: pass.

## Deviations

- **List row heights.** Rows use `ListRow density="compact"` (#99):
  13 px titles (`labelSm`, 13/16) and 11 px mono meta (`monoSm`,
  11/16). A title and meta row is 58 px against Figma's 55: Figma's
  text boxes are 17 and 14 px high, and the library keeps line heights
  on the 4 px grid (d-072). Each group below the first starts lower (NEXT STEPS y +18, SNOOZED y +26),
  about half the offset of the 14 px rows.
- **Group headers.** 38 px high against Figma's 34 (`h +4` on each group
  header): the library's `GroupHeader` after the 4 px grid (#96).
- **Detail text.** WHY and the prompt use `bodySm` (13/20, #99), as
  Figma's WHY (346:354 in D1) does, so WHY fits on one line. Figma's
  prompt lines are 21 px apart; `bodySm` keeps 20 (4 px grid). The
  prompt's five lines hold all of it, so it does not fade where Figma
  fades its fifth line.
  The mono lines in the detail (the task bar, the chips, the run line)
  stay in `mono` (12 px) against Figma's 11; this round changed only
  the body text.
- **Section gaps.** Sections are 24 px apart against Figma's 22; 22 has
  no spacing token and ties go to the larger (d-072).
- **Detail inset.** The column starts at x 524 instead of 520: the
  library's `Container size="detail"` pads 40 px where Figma has 36
  (d-072 tie). Within the 4 px tolerance.
- **Filter menu.** 300 px wide (`Popover width="filter"`) with the counts
  in `Checkbox trailing`. Rows are 34 px apart against 30 (the `label`
  line height and the 16 px box against Figma's 14), so the menu is 62 px
  taller (`filter popover` h +62). The project and tag labels are mono
  (`Checkbox labelStyle="mono"`, #98). The `filter popover` key now sits
  on the popover's box (#98); the box starts 6 px lower than Figma's
  (y +6).
- **Section offsets.** WHY starts 6 px lower and the sections after it 10
  to 22 px lower (SOURCES y +22), from the title block, the run card and
  the gaps. Round 3 had 28 to 40: WHY no longer wraps.

## Second review

Rounds 4 and 5 had no new second review: round 4 changed only the row
and body text sizes, and round 5 only put in the #101 parts; the checks
above measure those. The findings below are from
the earlier rounds; those about taller rows and wider detail text are
now smaller (see "List row heights" and "Detail text").

Round 2's review; round 3 changed only the parts below. Library main
66a44c5 fixed two of its findings in every frame: Sort now shows
`SortDescIcon` (Figma's arrow with lines), and status pills have no
border. A separate agent compared `frame.png` with the render, without these
notes. What it found in every frame, and why it stays:

- List rows taller, list text and approval buttons larger, detail text
  wider: the type sizes above.
- Search, Newest and Filter differ by up to 18 px in width, the filter
  chip counts, the pane count, timestamps, meta lines and section labels
  are brighter, and the rail labels sit 4 to 12 px lower: library styles
  (`SearchField`, `Button`, `FilterChips`, `PageHeader`, the rail) and
  their colour tokens. The app sets none of these values.
- The NCC chip's tint is fainter than Figma's (`MetaChip tone="issue"`):
  library style.
- The detail column is 4 px to the right: the 40 px inset above.

For D04 it also found:

- Project and tag labels in sans, not mono: fixed in round 3
  (`labelStyle="mono"`).
- The menu is 62 px taller (rows 34 px apart against 30) and its counts
  sit 9 px further right and are brighter: the `Checkbox` size and type
  sizes.
- The list shows faintly through the menu: `surface.overlay` has alpha
  0.98 (library style).
