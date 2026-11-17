# D01 deviations

What still differs from Figma after round 2 of the fidelity loop
(`pnpm fidelity inbox D01`, 2026-11-16, library main 52e3887), each with
its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass.
- Position: 8 of 16 layers pass (`inbox list`, `header`, `filter · chips`, `list tools`, `group · NEEDS YOU`, `task pane`, `task bar`, `title block`).
- Rules: pass.

## Deviations

- **List row heights.** Rows are 62 px instead of 55 px: Figma's row
  uses smaller text (17 px title, 14 px meta) than the library's `label`
  and `mono` styles. Line heights stay as the tokens set them (d-072), so
  each group below Needs you starts lower (NEXT STEPS y +34, SNOOZED y +57).
- **Group headers.** 38 px high against Figma's 34 (`h +4` on each group
  header): the library's `GroupHeader` after the 4 px grid (#96).
- **Detail text.** Figma's body and mono text in the detail is narrower
  than the library's `body` and `mono` styles, so lines wrap sooner:
  the WHY line takes two lines (`section · WHY` h +22) and the prompt's five lines hold all of it. Each extra line moves the sections below it down.
- **Section gaps.** Sections are 24 px apart against Figma's 22; 22 has
  no spacing token and ties go to the larger (d-072).
- **Detail inset.** The column starts at x 524 instead of 520: the
  library's `Container size="detail"` pads 40 px where Figma has 36
  (d-072 tie). Within the 4 px tolerance.
- **Section offsets.** WHY starts 6 px lower and the sections after it 30
  to 64 px lower (SOURCES y +64), from the title block, the WHY wrap and
  the section gaps above.
- **Prompt fade.** The prompt sits in `Clamp lines={5} fade`. In the
  render the whole prompt fits in five lines, so it is not cut and does
  not fade; Figma fades its fifth line.
- **My notes.** The box is 16 px taller (line heights, and the "Add a
  note…" field is a 1-row `TextArea` at its minimum height).

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

For D01 it also found: the prompt does not fade (above); "Read the whole
prompt", RUN IN, Start, MY NOTES and SOURCES lower (the offsets above).
