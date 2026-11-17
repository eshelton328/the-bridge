# D05 deviations

What still differs from Figma after round 2 of the fidelity loop
(`pnpm fidelity inbox D05`, 2026-11-16, library main 52e3887), each with
its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass.
- Position: 6 of 10 layers pass (`inbox list`, `header`, `filter · chips`, `list tools`, `group · NEEDS YOU`, `task pane`).
- Rules: pass.

## Deviations

- **List row heights.** Rows are 62 px instead of 55 px: Figma's row
  uses smaller text (17 px title, 14 px meta) than the library's `label`
  and `mono` styles. Line heights stay as the tokens set them (d-072), so
  each group below Needs you starts lower (NEXT STEPS y +34, SNOOZED y +52, RUNNING y +56).
- **Group headers.** 38 px high against Figma's 34 (`h +4` on each group
  header): the library's `GroupHeader` after the 4 px grid (#96).
- **Started task header.** 12 px taller (`started task` h +12): the mono
  meta line is wider than Figma's and wraps "5.5" onto a second line.
  Same text-size cause as the rows.
- **Detail inset.** The column starts at x 524 instead of 520 (`Container
  size="detail"` pads 40 where Figma has 36, d-072 tie).

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

For D05 it also found:

- The meta line of the header wraps "5.5" (see above); the prompt bubble
  and Claude's message break their lines earlier and the Copy button is
  larger: the type sizes.
- The dot before "Creating 9 issues in NCC…" is lavender, not cyan:
  library gap (`ToolLine`).
- The composer has no cyan focus border (a story cannot focus a field
  without a user action), its Stop icon is an outline square and its
  model chevron is thin: library styles.
