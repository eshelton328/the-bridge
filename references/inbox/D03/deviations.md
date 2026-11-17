# D03 deviations

What still differs from Figma after round 6 of the fidelity loop
(`pnpm fidelity inbox D03`, 2026-11-16, against the installed
library 1.0.0-beta.3, which has #97 to #102), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass. The text check of main 3546ac7 (#3) skips the values of
  radio, checkbox, hidden and password inputs, so the option ids inside
  `OptionList` rows no longer count as visible text.
  One exception in `exceptions.json` (the "|" Figma draws as the editor's caret).
- Position: 8 of 16 layers pass (`inbox list`, `header`, `filter · chips`, `list tools`, `group · NEEDS YOU`, `task pane`, `task bar`, `title block`).
- Rules: pass. The `hiddenOverflow` on `[data-figma="run in picker"]` of round 5 is gone: the picker no longer scrolls (below).

## Deviations

- **List row heights.** Rows use `ListRow density="compact"` (#99):
  13 px titles (`labelSm`, 13/16) and 11 px mono meta (`monoSm`,
  11/16). A title and meta row is 58 px against Figma's 55: Figma's
  text boxes are 17 and 14 px high, and the library keeps line heights
  on the 4 px grid (d-072). Each group below the first starts lower (NEXT STEPS y +18, SNOOZED y +29),
  about half the offset of the 14 px rows.
- **Group headers.** 38 px high against Figma's 34 (`h +4` on each group
  header): the library's `GroupHeader` after the 4 px grid (#96).
- **Detail text.** WHY uses `bodySm` (13/20, #99), as Figma's
  346:1170 does, through `MarkdownView size="sm" padding="none"`
  (#102), and fits on one line. The prompt editor is a
  `TextArea textSize="sm"` (#102) and takes two lines, as in Figma.
  The field is now 13 px lower than Figma's (`section · SUGGESTED PROMPT`
  h -11, round 5 h +9): `TextArea` pads 8 px above and below with
  20 px lines (60 px for two lines), where Figma's field (346:1188) is
  73 px, its text inset 15.5 px with 21 px lines. No token gives those
  values; LIBRARY_GAPS.md lists it.
  The mono lines in the detail (the task bar, the chips, the tags, the
  run line, the note's author and the source details) use `monoSm`
  (11/16, #102), Figma's 11 px; `MetaChip` and `TagsLine` take
  `size="sm"`. Their line boxes stay 16 px against Figma's 14 (4 px
  grid), so no layer moved.
- **Section gaps.** Sections are 24 px apart against Figma's 22; 22 has
  no spacing token and ties go to the larger (d-072).
- **Detail inset.** The column starts at x 524 instead of 520: the
  library's `Container size="detail"` pads 40 px where Figma has 36
  (d-072 tie). Within the 4 px tolerance.
- **Run in picker.** It opens below Change (`placement="bottom-end"`,
  `flip={false}`, #98) and no longer scrolls: the smaller prompt editor
  moved the detail up (RUN IN now within tolerance in y, `start` y +12,
  round 5 y +32), so the picker starts 6.5 px lower than Figma's
  (`run in picker` y +6.5, round 5 y +26.5), and its rows use
  `OptionList size="sm"` (#102): `labelSm` titles and `monoSm` meta, as
  Figma's 17 and 14 px text boxes are. It is still 9 px taller
  (`run in picker` h +9, round 5 h +12), within the library's own row
  and group heights; this round did not measure which rows add it. The
  note and the last row are in full view. The `run in picker` key sits on the popover's box (#98).
- **Prompt editor.** The editor is not shown focused, so its border is
  the field border, not cyan. A story cannot focus a field without a
  user action.

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
  their colour tokens. The app sets none of these values.
- The NCC chip's tint is fainter than Figma's (`MetaChip tone="issue"`):
  library style.
- The detail column is 4 px to the right: the 40 px inset above.

For D03 it also found:

- P1: the picker opened above Change, covered the header and the
  prompt, and cut off its note. Round 3 opens it below Change; since
  round 6 it no longer scrolls (see "Run in picker" above).
- The prompt editor has no cyan focus border or caret (see above).
- The chosen picker row had no row fill, and the picker's status pills
  had borders: fixed by `OptionList selectedFill` and the pill change
  (#98).
