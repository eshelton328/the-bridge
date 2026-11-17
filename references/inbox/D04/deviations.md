# D04 deviations

What still differs from Figma after round 7 of the fidelity loop
(`pnpm fidelity inbox D04`, 2026-11-16, against the installed
library 1.0.0-beta.4, which has #97 to #103), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

Updated on 2026-11-17 against the installed library 1.0.0-beta.5 (#104 to #106) by
`pnpm fidelity inbox`; the checks and offsets below are from that run.

## Checks

- Text: pass. The text check of main 3546ac7 (#3) skips the values of
  radio, checkbox, hidden and password inputs, so the option ids inside
  `Checkbox` rows no longer count as visible text.
  The hidden "Run the readme" row is excepted in `exceptions.json`.
- Position: 8 of 16 layers pass (`inbox list`, `header`, `filter · chips`, `list tools`, `group · NEEDS YOU`, `task pane`, `task bar`, `title block`).
- Rules: pass.

## Deviations

- **List row heights.** Rows use `ListRow density="compact"` (#99):
  13 px titles (`labelSm`, 13/16) and 11 px mono meta (`monoSm`,
  11/16). A title and meta row is 58 px against Figma's 55: Figma's
  text boxes are 17 and 14 px high, and the library keeps line heights
  on the 4 px grid (d-072). Each group below the first starts lower (NEXT STEPS y +18, SNOOZED y +26),
  about half the offset of the 14 px rows.
- **Group headers.** 38 px high against Figma's 34 (`h +4` on each group
  header): the library's `GroupHeader` after the 4 px grid (#96).
- **Detail text.** WHY and the prompt use `bodySm` (13/20, #99; WHY
  through `MarkdownView size="sm" padding="none"`, #102), as Figma's WHY
  (346:354 in D1) does, so WHY fits on one line. Figma's prompt lines
  are 21 px apart; `bodySm` keeps 20 (4 px grid). The prompt's five
  lines hold all of it, so it does not fade where Figma fades its fifth
  line (`section · SUGGESTED PROMPT` h -4). Since beta.5 the prompt's
  `bodySm` sits on a block around `Clamp`, not on an inline span: there
  its 13 px text in the panel's 14 px line made 21 px lines, and the
  faded `Clamp` (#104), which now cuts at five lines' height with no
  ellipsis, would hide the fifth. Five 20 px lines are 100 px, not 105,
  so the prompt is 5 px shorter and the layers below it 5 px higher. The
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
- **Filter menu.** 300 px wide (`Popover width="filter"`) with the counts
  in `Checkbox trailing`. The rows are `Checkbox size="sm"` (beta.4,
  #103): kind labels in `small` (12/16) and counts in `monoSm`, as Figma
  346:1745 and 346:1747. Rows are still 34 px apart against 30 (the
  library row's padding and its 16 px box against Figma's 14), so the menu
  is 62 px taller (`filter popover` h +62). The project and tag labels are mono
  (`Checkbox labelStyle="mono"`, #98). The `filter popover` key now sits
  on the popover's box (#98); the box starts 6 px lower than Figma's
  (y +6).
- **Section offsets.** WHY starts 6 px lower and the sections after it
  10 to 12 px lower (SOURCES y +12; RUN IN y +8), from the title block,
  the run card and the gaps. Round 3 had 28 to 40: WHY no longer wraps.
- **Beta.5 (2026-11-17).** The new library parts move these layers:
  `section · RUN IN` x +4, y +8, h +1 (was x +4, y +10, h +5);
  `section · SOURCES` x +4, y +12, h +2 (was x +4, y +18, h +2);
  `section · SUGGESTED PROMPT` x +4, y +10, h -4 (was x +4, y +10, h
  -2); `start` x +4, y +11, h -1 (was x +4, y +17, h -1). The cause is
  the 20 px pills (`Badge size="sm"`; Figma's pills are 20, beta.4 drew
  24) and the prompt's 20 px lines (see "Detail text").
  `section · SUGGESTED PROMPT` moves further from Figma: the
  Figma-matching change exposes an offset that was already there, which
  the 24 px pills and 21 px prompt lines had hidden.

## Second review

Rounds 4 to 6 had no new second review: round 4 changed only the row
and body text sizes, round 5 only put in the #101 parts and round 6
only the #102 small sizes, and round 7 the #103 small `Checkbox`; the checks
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

For D04 it also found:

- Project and tag labels in sans, not mono: fixed in round 3
  (`labelStyle="mono"`).
- The menu is 62 px taller (rows 34 px apart against 30) and its counts
  sit 9 px further right and are brighter: the `Checkbox` row height.
  The label and count sizes are fixed with `size="sm"` (beta.4).
- The list shows faintly through the menu: `surface.overlay` has alpha
  0.98 (library style).
