# D21 deviations

What still differs from Figma after round 3 of the fidelity loop
(`pnpm fidelity inbox D21`, 2026-11-16, against the installed
library 1.0.0-beta.3), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass; the hidden Snooze, Dismiss, Reset and Edit are excepted in `exceptions.json`.
- Position: 8 of 14 layers pass (`inbox list`, `header`, `filter · chips`, `list tools`, `group · TODAY`, `task pane`, `task bar`, `title block`).
- Rules: pass.

## Deviations

- **List row heights.** Rows use `ListRow density="compact"` (#99):
  13 px titles (`labelSm`, 13/16) and 11 px mono meta (`monoSm`,
  11/16). A title and meta row is 58 px against Figma's 55: Figma's
  text boxes are 17 and 14 px high, and the library keeps line heights
  on the 4 px grid (d-072). Each group below the first starts lower (YESTERDAY y +10).
- **Group headers.** 38 px high against Figma's 34 (`h +4` on each group
  header): the library's `GroupHeader` after the 4 px grid (#96).
- **Removed row.** The outcome line has a bin and is `status.danger.fg`,
  as Figma's red line.
- **Removed task.** The status pill is `danger` "Removed", the prompt
  heading "Prompt · not run" with no buttons, and the card that shows
  how it ended is `RunCard` (`result card`) with a `danger` pill, Open
  discussion and Restore. Figma draws its border red; `Panel` has no
  danger tone (library gap), so the border is the default. It starts
  23 px lower, from the offsets above.
- **Done rows.** As in D07: Figma fades the kind tile of a done row that
  is not selected to 0.6; no token has that opacity.
- **Detail text.** WHY and the prompt use `bodySm` (13/20), and the mono
  lines `monoSm` (11/16), as in D01 to D12. Figma's prompt lines are 21 px
  apart and its mono boxes 14 px high; the library keeps 20 and 16 (4 px
  grid). The prompt's five lines hold all of it, so it does not fade where
  Figma fades its fifth line (`section · SUGGESTED PROMPT` h +7).
- **Section gaps.** Sections are 24 px apart against Figma's 22; 22 has
  no spacing token and ties go to the larger (d-072). With the taller
  notes box (16 px, the `TextArea` field) the sections below WHY start
  lower: RESULT CARD y +23, MY NOTES y +26, SOURCES y +44.
- **Detail inset.** The column starts at x 524 instead of 520 (`Container
  size="detail"` pads 40 where Figma has 36, d-072 tie). Within the 4 px
  tolerance.
- **Hidden Figma text.** Figma keeps Snooze and Dismiss in the task bar
  and Reset and Edit in the prompt header as hidden layers;
  `exceptions.json` excepts them, as in D07.

## Second review

Not run by the builder; the coordinator runs the blind fidelity-reviewer
on `reports/fidelity/inbox/D21.sideBySide.png`.
