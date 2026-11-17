# D02 deviations

What still differs from Figma after round 5 of the fidelity loop
(`pnpm fidelity inbox D02`, 2026-11-16, against the installed
library 1.0.0-beta.2, which has #97 to #101), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass. The text check of main 3546ac7 (#3) skips the values of
  radio, checkbox, hidden and password inputs, so the option ids inside
  `OptionList` rows no longer count as visible text.
- Position: 8 of 15 layers pass (`inbox list`, `header`, `filter · chips`, `list tools`, `group · NEEDS YOU`, `task pane`, `task bar`, `title block`).
- Rules: pass.

## Deviations

- **List row heights.** Rows use `ListRow density="compact"` (#99):
  13 px titles (`labelSm`, 13/16) and 11 px mono meta (`monoSm`,
  11/16). A title and meta row is 58 px against Figma's 55: Figma's
  text boxes are 17 and 14 px high, and the library keeps line heights
  on the 4 px grid (d-072). Each group below the first starts lower (NEXT STEPS y +16, SNOOZED y +29),
  about half the offset of the 14 px rows.
- **Group headers.** 38 px high against Figma's 34 (`h +4` on each group
  header): the library's `GroupHeader` after the 4 px grid (#96).
- **Detail text.** CONTEXT uses `bodySm` (13/20, #99), Figma's 13 px
  body. The option cards are still taller (`section · CHOOSE ONE` h +15):
  their descriptions are `OptionList` text in the library's 14 px
  style, which the app cannot set. Each extra line moves the sections
  below it down.
  The mono lines in the detail (the task bar, the chips, the run line)
  stay in `mono` (12 px) against Figma's 11; this round changed only
  the body text.
- **Section gaps.** Sections are 24 px apart against Figma's 22; 22 has
  no spacing token and ties go to the larger (d-072).
- **Detail inset.** The column starts at x 524 instead of 520: the
  library's `Container size="detail"` pads 40 px where Figma has 36
  (d-072 tie). Within the 4 px tolerance.
- **Waiting box.** `Panel tone="needsYou"` now draws the needs-you border
  and tint; the box is 9 px taller (`blocking` h +9, line heights).
- **Section offsets.** CONTEXT starts 17 px lower and the answer row 43 px
  lower, from the waiting box, the card heights and the section gaps.

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

For D02 it also found:

- A resize handle on the note field. Fixed: the field now uses
  `autoresize`, which turns resizing off.
- The waiting box's tint is lighter than Figma's: library style
  (LIBRARY_GAPS.md). The chosen radio had a ring around its dot; the
  card radio is a dot since #98.
- CONTEXT breaks its first line one word earlier, and the option cards
  and the answer row sit lower: the type sizes and offsets above.
