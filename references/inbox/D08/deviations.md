# D08 deviations

What still differs from Figma after round 1 of the fidelity loop
(`pnpm fidelity inbox D08`, 2026-11-16, library main 66a44c5), each with
its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass.
- Position: 8 of 17 layers pass (`inbox list`, `header`, `filter · chips`, `list tools`, `group · NEEDS YOU`, `task pane`, `task bar`, `title block`).
- Rules: pass.

## Deviations

- **List row heights.** Rows are 62 px instead of 55 px: Figma's row
  uses smaller text (17 px title, 14 px meta) than the library's `label`
  and `mono` styles (Figma sets rows and body in 13 px and meta in 11;
  the library's `label`, `body` and `mono` are 14 and 12, an open
  decision for Erik). Line heights stay as the tokens set them (d-072),
  so each group below the first starts lower (NEXT STEPS y +34, SNOOZED y +57).
- **Group headers.** 38 px high against Figma's 34 (`h +4` on each group
  header): the library's `GroupHeader` after the 4 px grid (#96).
- **Detail text.** The detail's body and mono lines are wider than
  Figma's for the same type-size reason, so they wrap sooner: WHY takes
  two lines (`section · WHY` h +22) and the prompt's five lines hold all
  of it, so it does not fade where Figma fades its fifth line. Each
  extra line moves the sections below it down.
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
