# D01 deviations

What still differs from Figma after round 6 of the fidelity loop
(`pnpm fidelity inbox D01`, 2026-11-16, against the installed
library 1.0.0-beta.3, which has #97 to #102), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

Updated on 2026-11-17 against the installed library 1.0.0-beta.7 (#107, #108) by
`pnpm fidelity inbox`; the checks and offsets below are from that run.

## Checks

- Text: pass.
- Position: 9 of 16 layers pass (`inbox list`, `header`, `filter · chips`, `list tools`, `group · NEEDS YOU`, `group · NEXT STEPS`, `task pane`, `task bar`, `title block`).
- Rules: pass.

## Deviations

- **List row heights.** Rows use `ListRow density="compact"` (#99):
  13 px titles (`labelSm`, 13/16) and 11 px mono meta (`monoSm`,
  11/16). A title and meta row is 56 px against Figma's 55, the 4 px
  grid value nearest Figma's (d-100, library #108). Each group below
  the first starts a little lower: NEXT STEPS within the 4 px
  tolerance, SNOOZED y +5.
- **Group headers.** 36 px high against Figma's 34 (`h +2` on each group
  header), the 4 px grid value nearest Figma's (d-100, library #108).
  The label's centre is 20 px from its top (Figma 21).
- **Detail text.** WHY and the prompt use `bodySm` (13/20, #99; WHY
  through `MarkdownView size="sm" padding="none"`, #102), as Figma's WHY
  (346:354 in D1) does, so WHY fits on one line. Figma's prompt lines
  are 21 px apart; `bodySm` keeps 20 (4 px grid). The prompt's five
  lines hold all of it, so it does not fade where Figma fades its fifth
  line (`section · SUGGESTED PROMPT` h -2). Since beta.5 the prompt's
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
- **Button labels.** Reset, Edit, Change, Snooze and Dismiss take
  Medium 12 labels (`textSize="xs"`) and Start takes SemiBold 13
  (`textSize="smStrong"`), as Figma's.
- **Section gaps.** Sections are 24 px apart against Figma's 22; 22 has
  no spacing token and ties go to the larger (d-072).
- **Detail inset.** The column starts at x 524 instead of 520: the
  library's `Container size="detail"` pads 40 px where Figma has 36
  (d-072 tie). Within the 4 px tolerance.
- **Section offsets.** WHY starts 6 px lower and the sections after it
  10 to 28 px lower (SOURCES y +28), from the title block, the run card,
  the notes box and the section gaps above. Round 3 had 30 to 64: WHY no
  longer wraps.
- **Prompt fade.** The prompt sits in `Clamp lines={5} fade`. In the
  render the whole prompt fits in five lines, so it is not cut and does
  not fade; Figma fades its fifth line. A longer prompt is cut at five
  lines' height and fades with no ellipsis (#104).
- **My notes.** The box is 16 px taller (line heights, and the "Add a
  note…" field is a 1-row `TextArea` at its minimum height).
- **Beta.5 (2026-11-17).** The new library parts move these layers:
  `section · MY NOTES` x +4, y +14, h +12 (was x +4, y +23, h +12);
  `section · RUN IN` x +4, y +10, h +1 (was x +4, y +15, h +5);
  `section · SOURCES` x +4, y +28, h +2 (was x +4, y +37, h +2);
  `section · SUGGESTED PROMPT` x +4, y +10, h -2 (was x +4, y +10, h
  +3); `start` x +4, y +13, h -1 (was x +4, y +22, h -1). The cause is
  the 20 px pills (`Badge size="sm"`; Figma's pills are 20, beta.4 drew
  24) and the prompt's 20 px lines (see "Detail text").
- **Beta.7 (2026-11-17).** Library 1.0.0-beta.6 and beta.7 (#107,
  #108) move these layers: `group · NEXT STEPS` within tolerance (was
  x +0, y +18, w +1, h +4); `group · SNOOZED` x +0, y +5, w +1, h +2
  (was x +0, y +29, w +1, h +4). The cause is #108's compact `ListRow`
  (56 px, was 58; Figma 55) and list `GroupHeader` (36 px, was 38;
  Figma 34).

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
  wider: the type sizes above. (Since beta.7 the rows are 56 px against
  55, and the approval row's Allow once, Deny and Open chat take Medium
  12 labels, `textSize="xs"`, as Figma's.)
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

For D01 it also found: the prompt does not fade (above); "Read the whole
prompt", RUN IN, Start, MY NOTES and SOURCES lower (the offsets above).
