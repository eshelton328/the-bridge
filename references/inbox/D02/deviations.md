# D02 deviations

What still differs from Figma after round 6 of the fidelity loop
(`pnpm fidelity inbox D02`, 2026-11-16, against the installed
library 1.0.0-beta.3, which has #97 to #102), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

Updated on 2026-11-17 against the installed library 1.0.0-beta.5 (#104 to #106) by
`pnpm fidelity inbox`; the checks and offsets below are from that run.

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
  body, through `MarkdownView size="sm" padding="none"` (#102). The
  option cards use `OptionList size="sm"` (#102): 13 px titles
  (`labelSm`) and 12 px descriptions, as Figma's 17 and 16 px text boxes
  are. The cards are still 3 px taller in all (`section · CHOOSE ONE` h
  +3; h +7 before beta.5's 20 px Recommended pill, round 5 h +15): the 4
  px grid rounds the 17 px title box to 16 and pads the cards to it. The
  note field is a `TextArea textSize="sm"` (13 px, Figma's 346:812). The
  mono lines in the detail (the task bar, the chips, the tags, the run
  line, the note's author and the source details) use `monoSm` (11/16,
  #102), Figma's 11 px; `MetaChip` and `TagsLine` take `size="sm"`.
  Their line boxes stay 16 px against Figma's 14 (4 px grid), so no
  layer moved.
- **Section gaps.** Sections are 24 px apart against Figma's 22; 22 has
  no spacing token and ties go to the larger (d-072).
- **Detail inset.** The column starts at x 524 instead of 520: the
  library's `Container size="detail"` pads 40 px where Figma has 36
  (d-072 tie). Within the 4 px tolerance.
- **Waiting box.** `Panel tone="needsYou"` now draws the needs-you border
  and tint; the box is 9 px taller (`blocking` h +9, line heights).
- **Section offsets.** CONTEXT starts 17 px lower and the answer row 31
  px lower (35 before beta.5, round 5: 43), from the waiting box, the
  card heights and the section gaps.
- **Beta.5 (2026-11-17).** The new library parts move these layers:
  `answer` x +4, y +31, h -1 (was x +4, y +35, h -1);
  `section · CHOOSE ONE` x +4, y +21, h +3 (was x +4, y +21, h +7);
  `section · NOTE TO THE CHAT · OPTIONAL` x +4, y +26, h +3 (was x +4, y
  +30, h +3). The cause is the Recommended pill in the option card, now
  20 px (`Badge size="sm"`) as Figma's.

## Second review

Rounds 4 to 6 had no new second review: round 4 changed only the row
and body text sizes, round 5 only put in the #101 parts and round 6
only the #102 small sizes; the checks
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
  their colour tokens. The app sets none of these values. (Fixed in part
  by beta.5: Newest or Sort and Filter take Medium 13 labels and the
  search field 13 px text, as Figma's, and the idle chip counts are
  `fg.subtle`, still brighter than Figma's #4a5675, which d-099 keeps
  out because it fails WCAG AA, d-055.)
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
