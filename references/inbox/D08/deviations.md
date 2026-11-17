# D08 deviations

What still differs from Figma after round 4 of the fidelity loop
(`pnpm fidelity inbox D08`, 2026-11-16, with the stricter checks of main
e4da0c8, against a local build of library main 60170df: #97 to #99 are
not in the installed 1.0.0-beta.1), each with
its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass.
- Position: 8 of 17 layers pass (`inbox list`, `header`, `filter · chips`, `list tools`, `group · NEEDS YOU`, `task pane`, `task bar`, `title block`).
- Rules: pass.

## Deviations

- **List row heights.** Rows use `ListRow density="compact"` (#99):
  13 px titles (`labelSm`, 13/16) and 11 px mono meta (`monoSm`,
  11/16). A title and meta row is 58 px against Figma's 55: Figma's
  text boxes are 17 and 14 px high, and the library keeps line heights
  on the 4 px grid (d-072). Each group below the first starts lower (NEXT STEPS y +18, SNOOZED y +29),
  about half the offset of the 14 px rows.
- **Group headers.** 38 px high against Figma's 34 (`h +4` on each group
  header): the library's `GroupHeader` after the 4 px grid (#96).
- **Detail text.** WHY and the prompt use `bodySm` (13/20, #99), as
  Figma's WHY (346:354 in D1) does, so WHY fits on one line. Figma's
  prompt lines are 21 px apart; `bodySm` keeps 20 (4 px grid). The
  prompt's five lines hold all of it, so it does not fade where Figma
  fades its fifth line (`section · SUGGESTED PROMPT` h +7).
  The mono lines in the detail (the task bar, the chips, the run line)
  stay in `mono` (12 px) against Figma's 11; this round changed only
  the body text.
- **Section gaps.** Sections are 24 px apart against Figma's 22; 22 has
  no spacing token and ties go to the larger (d-072).
- **Detail inset.** The column starts at x 524 instead of 520 (`Container
  size="detail"` pads 40 where Figma has 36, d-072 tie). Within the 4 px
  tolerance.
- **Prompt dialog.** `Dialog size="lg"` is 540 px wide against Figma's
  720 (346:3543), so the prompt wraps to seven lines (`346:3548` x +94,
  w -188). Done is a text button in the footer, not at the end of the
  title row (library gap: wide dialog with a header action). Edit prompt
  and Copy fill the width in a two-column `Grid`. `Dialog` takes no
  data attribute, so the dialog box itself is not position-checked; the
  prompt text carries the key.
- **Focus.** Ark focuses the first button when the dialog opens, so
  Edit prompt shows a focus ring; Figma shows none.

## Second review

Round 4 had no new second review: it changed only the row and body text
sizes, and the checks above measure those. The findings below are from
the earlier rounds; those about taller rows and wider detail text are
now smaller (see "List row heights" and "Detail text").

A separate agent compared `frame.png` with the render, without these
notes. What it found in every frame, and why it stays:

- List rows taller, list, title and detail text larger, approval
  buttons larger, WHY on two lines, the prompt without its fade, MY
  NOTES 12 to 16 px taller: the type sizes above.
- Search, Sort and Filter differ by up to 19 px in width, the chip
  counts, placeholder, timestamps and meta lines are brighter, and the
  rail labels sit 4 to 12 px lower: library styles (`SearchField`,
  `Button`, `FilterChips`, `PageHeader`, the rail) and their colour
  tokens. The app sets none of these values.
- The detail column is 4 px to the right: the 40 px inset above.

For D08 it also found:

- P1: the dialog is 180 px narrower and taller, and Done sits under the
  buttons, not in the title row: library gap (wide dialog with a header
  action). Not fixed.
- P2: Edit prompt has a focus ring (see Focus above).
- The body is 14 px against Figma's 15 and the title larger: library
  type styles (`body`, `subtitle`).
