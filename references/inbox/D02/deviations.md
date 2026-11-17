# D02 deviations

What still differs from Figma after round 2 of the fidelity loop
(`pnpm fidelity inbox D02`, 2026-11-16, library main 52e3887), each with
its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass.
- Position: 8 of 15 layers pass (`inbox list`, `header`, `filter · chips`, `list tools`, `group · NEEDS YOU`, `task pane`, `task bar`, `title block`).
- Rules: pass.

## Deviations

- **List row heights.** Rows are 62 px instead of 55 px: Figma's row
  uses smaller text (17 px title, 14 px meta) than the library's `label`
  and `mono` styles. Line heights stay as the tokens set them (d-072), so
  each group below Needs you starts lower (NEXT STEPS y +32, SNOOZED y +57).
- **Group headers.** 38 px high against Figma's 34 (`h +4` on each group
  header): the library's `GroupHeader` after the 4 px grid (#96).
- **Detail text.** Figma's body and mono text in the detail is narrower
  than the library's `body` and `mono` styles, so lines wrap sooner:
  the option cards are taller (`section · CHOOSE ONE` h +15). Each extra line moves the sections below it down.
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

A separate agent compared `frame.png` with the render, without these
notes. What it found in every frame, and why it stays:

- List rows taller, list text and approval buttons larger, detail text
  wider: the type sizes above.
- Sort shows `SortIcon`, not Figma's arrow with lines: library gap.
- Search, Newest and Filter differ by up to 18 px in width, the filter
  chip counts, the pane count, timestamps, meta lines and section labels
  are brighter, and the rail labels sit 4 to 12 px lower: library styles
  (`SearchField`, `Button`, `FilterChips`, `PageHeader`, the rail) and
  their colour tokens. The app sets none of these values.
- Status pills have a 1 px border; the NCC chip's tint is fainter than
  Figma's (`MetaChip tone="issue"`): library styles.
- The detail column is 4 px to the right: the 40 px inset above.

For D02 it also found:

- A resize handle on the note field. Fixed: the field now uses
  `autoresize`, which turns resizing off.
- The waiting box's tint is lighter than Figma's, and the chosen radio
  has a ring around its dot: library styles (LIBRARY_GAPS.md).
- CONTEXT breaks its first line one word earlier, and the option cards
  and the answer row sit lower: the type sizes and offsets above.
