# D10 deviations

What still differs from Figma after round 5 of the fidelity loop
(`pnpm fidelity inbox D10`, 2026-11-16, against the installed
library 1.0.0-beta.2, which has #97 to #101), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass; the summary and Done hint, which get_metadata gives by their layer names, and the hidden Reset and Edit are excepted in `exceptions.json`.
- Position: 9 of 16 layers pass (`inbox list`, `header`, `filter · chips`, `list tools`, `search summary`, `group · NEEDS YOU`, `task pane`, `task bar`, `title block`).
- Rules: pass.

## Deviations

- **List row heights.** Rows use `ListRow density="compact"` (#99):
  13 px titles (`labelSm`, 13/16) and 11 px mono meta (`monoSm`,
  11/16). A title and meta row is 58 px against Figma's 55: Figma's
  text boxes are 17 and 14 px high, and the library keeps line heights
  on the 4 px grid (d-072). Each group below the first starts lower (RUNNING y +13, `done hint` y +22),
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
- **Run card.** `Panel tone="accent"` (#101) gives it Figma's cyan
  border and tint. It starts 19 px lower (round 3: 34), from the
  offsets above.
- **Hidden Figma text.** Figma keeps the Reset and Edit buttons of the
  prompt header as hidden layers; `exceptions.json` excepts them with
  their node ids.
- **Search field.** Not shown focused: a story cannot focus a field
  without a user action, so it has no cyan border or caret. The clear
  button is `CloseCircleIcon` at 16 px (`clearSize="16"`, #101); Figma
  draws it at 15.
- **Marked query.** `Highlight variant="colour"` (#101) sets "f-005" in
  cyan only, as Figma does.
- **Selected row.** The open task's row under RUNNING has the selected
  colours, as in D6, D9 and D11. Figma's D10 draws it as a plain row
  while the task stays open on the right. The render follows the other
  frames; a question for Erik.

## Second review

Rounds 4 and 5 had no new second review: round 4 changed only the row
and body text sizes, and round 5 only put in the #101 parts; the checks
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

For D10 it also found:

- P2: no focus border or caret: see above. The clear icon and the bold,
  underlined marks are fixed in round 5 with #101.
- P2: the Running row is drawn selected: see "Selected row" above.
- The Done hint sits closer to the last row: the selected row's
  border and the row heights.
