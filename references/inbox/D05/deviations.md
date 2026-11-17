# D05 deviations

What still differs from Figma after round 4 of the fidelity loop
(`pnpm fidelity inbox D05`, 2026-11-16, with the stricter checks of main
e4da0c8, against a local build of library main 60170df: #97 to #99 are
not in the installed 1.0.0-beta.1), each with
its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass.
- Position: 6 of 10 layers pass (`inbox list`, `header`, `filter · chips`, `list tools`, `group · NEEDS YOU`, `task pane`).
- Rules: pass.

## Deviations

- **List row heights.** Rows use `ListRow density="compact"` (#99):
  13 px titles (`labelSm`, 13/16) and 11 px mono meta (`monoSm`,
  11/16). A title and meta row is 58 px against Figma's 55: Figma's
  text boxes are 17 and 14 px high, and the library keeps line heights
  on the 4 px grid (d-072). Each group below the first starts lower (NEXT STEPS y +18, SNOOZED y +28, RUNNING y +32),
  about half the offset of the 14 px rows.
- **Group headers.** 38 px high against Figma's 34 (`h +4` on each group
  header): the library's `GroupHeader` after the 4 px grid (#96).
- **Started task header.** 12 px taller (`started task` h +12): the mono
  meta line is wider than Figma's and wraps "5.5" onto a second line.
  Same text-size cause as the rows.
- **Detail inset.** The column starts at x 524 instead of 520 (`Container
  size="detail"` pads 40 where Figma has 36, d-072 tie).

## Second review

Round 4 had no new second review: it changed only the row and body text
sizes, and the checks above measure those. The findings below are from
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

For D05 it also found:

- The meta line of the header wraps "5.5" (see above); the prompt bubble
  and Claude's message break their lines earlier and the Copy button is
  larger: the type sizes.
- The dot before "Creating 9 issues in NCC…" was lavender, not cyan:
  fixed in the library (#98, `ToolLine` running dot).
- The composer has no cyan focus border (a story cannot focus a field
  without a user action), its Stop icon is an outline square and its
  model chevron is thin: library styles.
