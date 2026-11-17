# D08 deviations

What still differs from Figma after round 6 of the fidelity loop
(`pnpm fidelity inbox D08`, 2026-11-16, against the installed
library 1.0.0-beta.3, which has #97 to #102), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass.
- Position: 8 of 18 layers pass (`inbox list`, `header`, `filter · chips`, `list tools`, `group · NEEDS YOU`, `task pane`, `task bar`, `title block`).
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
- **Detail text.** WHY and the prompt use `bodySm` (13/20, #99; WHY through
  `MarkdownView size="sm" padding="none"`, #102), as
  Figma's WHY (346:354 in D1) does, so WHY fits on one line. Figma's
  prompt lines are 21 px apart; `bodySm` keeps 20 (4 px grid). The
  prompt's five lines hold all of it, so it does not fade where Figma
  fades its fifth line (`section · SUGGESTED PROMPT` h +7).
  The mono lines in the detail (the task bar, the chips, the tags, the
  run line, the note's author and the source details) use `monoSm`
  (11/16, #102), Figma's 11 px; `MetaChip` and `TagsLine` take
  `size="sm"`. Their line boxes stay 16 px against Figma's 14 (4 px
  grid), so no layer moved.
- **Section gaps.** Sections are 24 px apart against Figma's 22; 22 has
  no spacing token and ties go to the larger (d-072).
- **Detail inset.** The column starts at x 524 instead of 520 (`Container
  size="detail"` pads 40 where Figma has 36, d-072 tie). Within the 4 px
  tolerance.
- **Prompt dialog.** `Dialog size="wide"` (#101) is 720 px wide, as
  Figma's 346:3543, with Done as a text button at the end of the title
  row (`headerAction`). The dialog box carries `dialog · Suggested
  prompt`. The prompt is in `body` (14/20) against Figma's Regular 15
  with 23 px lines, which no text style has (library gap: Regular 15 px
  text), so it is 38 px shorter (`346:3548` y +35.5, h -38) and the
  dialog 51 px shorter (y +25.5, h -51).
- **Focus.** Ark focuses the first control when the dialog opens, which
  is now Done in the title row, so Done shows a focus ring; Figma shows
  none.

## Second review

Rounds 4 to 6 had no new second review: round 4 changed only the row
and body text sizes, round 5 only put in the #101 parts and round 6
only the #102 small sizes; the checks
above measure those. The findings below are from
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
  buttons, not in the title row. Fixed in round 5 with #101 (above).
- P2: Edit prompt has a focus ring (see Focus above; the ring is now on
  Done).
- The body is 14 px against Figma's 15 and the title larger: library
  type styles (`body`, `subtitle`).
