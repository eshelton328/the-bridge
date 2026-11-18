# D02 deviations

What still differs from Figma after round 6 of the fidelity loop
(`pnpm fidelity inbox D02`, 2026-11-16, against the installed
library 1.0.0-beta.3, which has #97 to #102), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

Updated on 2026-11-17 against the installed library 1.0.0-beta.7 (#107, #108) by
`pnpm fidelity inbox`; the checks and offsets below are from that run.

## Checks

- Text: pass. The text check of main 3546ac7 (#3) skips the values of
  radio, checkbox, hidden and password inputs, so the option ids inside
  `OptionList` rows no longer count as visible text.
- Position: 13 of 21 layers pass (`inbox list`, `header`, `filter · chips`, `list tools`, `group · NEEDS YOU`, `group · NEXT STEPS`, `task pane`, `task bar`, `title block`, `blocking`).
  The shared navigation's items pass too: `rail · Inbox`,
  `rail · Workspaces` and `rail · Projects`.
- Rules: pass.

## Failing layers

Render minus Figma, in px, from the step 13 run (`pnpm fidelity inbox`, 2026-11-17, library 1.0.0-beta.18).

- `group · SNOOZED`: x +0, y +5, w +1, h +2.
- `section · CONTEXT`: x +4, y +7, w +0, h +2.
- `section · CHOOSE ONE`: x +4, y +11, w +0, h +3.
- `section · NOTE TO THE CHAT · OPTIONAL`: x +4, y +16, w +0, h +3.
- `answer`: x +4, y +21, w +0, h -1.

## Deviations

- **Waiting card title (step 13).** The card's title is Geist Medium 13 in Figma (T3 346:5911), `labelSm` (13/16) here, not `label`, so the card is 56 high: Figma's 55 on the 4 px grid. `blocking` passes, and each layer under it moves 4 px up.
- **List row heights.** Rows use `ListRow density="compact"` (#99):
  13 px titles (`labelSm`, 13/16) and 11 px mono meta (`monoSm`,
  11/16). A title and meta row is 56 px against Figma's 55, the 4 px
  grid value nearest Figma's (d-100, library #108). Each group below
  the first starts a little lower: NEXT STEPS within the 4 px
  tolerance, SNOOZED y +5.
- **Group headers.** 36 px high against Figma's 34 (`h +2` on each group
  header), the 4 px grid value nearest Figma's (d-100, library #108).
  The label's centre is 20 px from its top (Figma 21).
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
- **Button labels.** Snooze, Dismiss and the waiting box's Open chat
  take Medium 12 labels (`textSize="xs"`), as Figma's.
- **Section gaps.** Sections are 24 px apart against Figma's 22; 22 has
  no spacing token and ties go to the larger (d-072).
- **Detail inset.** The column starts at x 524 instead of 520: the
  library's `Container size="detail"` pads 40 px where Figma has 36
  (d-072 tie). Within the 4 px tolerance.
- **Waiting box.** `Panel tone="needsYou"` draws the needs-you border
  and tint. The tint is 0.08, Figma's (library #107). The border is
  `status.needsYou.border` at 0.5 against Figma's 0.35: at 0.35 it is
  2.0:1 against the tint, under AA's 3:1 (d-100). The box is 9 px
  taller (`blocking` h +9, line heights).
- **Section offsets.** CONTEXT starts 17 px lower and the answer row 31
  px lower (35 before beta.5, round 5: 43), from the waiting box, the
  card heights and the section gaps.
- **Beta.5 (2026-11-17).** The new library parts move these layers:
  `answer` x +4, y +31, h -1 (was x +4, y +35, h -1);
  `section · CHOOSE ONE` x +4, y +21, h +3 (was x +4, y +21, h +7);
  `section · NOTE TO THE CHAT · OPTIONAL` x +4, y +26, h +3 (was x +4, y
  +30, h +3). The cause is the Recommended pill in the option card, now
  20 px (`Badge size="sm"`) as Figma's.
- **Beta.7 (2026-11-17).** Library 1.0.0-beta.6 and beta.7 (#107,
  #108) move these layers: `group · NEXT STEPS` within tolerance (was
  x +0, y +16, w +1, h +4); `group · SNOOZED` x +0, y +5, w +1, h +2
  (was x +0, y +29, w +1, h +4). The cause is #108's compact `ListRow`
  (56 px, was 58; Figma 55) and list `GroupHeader` (36 px, was 38;
  Figma 34).
- **Nav rail.** Figma's rail has no Artifacts or Toolkit item, so
  `rail · Artifacts` and `rail · Toolkit` have no layer, and
  `rail · More` sits 108 px lower (y +108). The design predates d-105,
  which adds the Toolkit (and Artifacts) item; the app draws the
  six-item navigation.

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

For D02 it also found:

- A resize handle on the note field. Fixed: the field now uses
  `autoresize`, which turns resizing off.
- The waiting box's tint is lighter than Figma's: library style. (Fixed
  by beta.7: the tint is 0.08, Figma's, library #107.) The chosen radio
  had a ring around its dot; the card radio is a dot since #98.
- CONTEXT breaks its first line one word earlier, and the option cards
  and the answer row sit lower: the type sizes and offsets above.
