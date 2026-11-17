# D03 deviations

What still differs from Figma after round 6 of the fidelity loop
(`pnpm fidelity inbox D03`, 2026-11-16, against the installed
library 1.0.0-beta.3, which has #97 to #102), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

Updated on 2026-11-17 against the installed library 1.0.0-beta.7 (#107, #108) by
`pnpm fidelity inbox`, and again on 2026-11-17 against 1.0.0-beta.9 (#110, #111);
the checks and offsets below are from the beta.9 run.

## Checks

- Text: pass. The text check of main 3546ac7 (#3) skips the values of
  radio, checkbox, hidden and password inputs, so the option ids inside
  `OptionList` rows no longer count as visible text.
  One exception in `exceptions.json` (the "|" Figma draws as the editor's caret).
- Position: 11 of 16 layers pass (`inbox list`, `header`, `filter · chips`, `list tools`, `group · NEEDS YOU`, `group · NEXT STEPS`, `task pane`, `task bar`, `title block`, `section · RUN IN`, `start`).
- Rules: pass. The `hiddenOverflow` on `[data-figma="run in picker"]` of round 5 is gone: the picker no longer scrolls (below).

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
- **Button labels.** Reset, Done, Change, Snooze and Dismiss take
  Medium 12 labels (`textSize="xs"`) and Start takes SemiBold 13
  (`textSize="smStrong"`), as Figma's.
- **Section gaps.** Sections are 24 px apart against Figma's 22; 22 has
  no spacing token and ties go to the larger (d-072).
- **Detail inset.** The column starts at x 524 instead of 520: the
  library's `Container size="detail"` pads 40 px where Figma has 36
  (d-072 tie). Within the 4 px tolerance.
- **Run in picker.** It opens below Change (`placement="bottom-end"`,
  `flip={false}`, #98) and no longer scrolls: the smaller prompt editor
  moved the detail up (RUN IN and `start` now within tolerance, round 5
  `start` y +32), so the picker starts 2.5 px lower than Figma's (`run
  in picker` y +2.5, round 5 y +26.5), and its rows use `OptionList
  size="sm"` (#102): `labelSm` titles and `monoSm` meta, as Figma's 17
  and 14 px text boxes are. It is still 5 px taller (`run in picker` h
  +5, round 5 h +12; beta.5's 20 px pills took 4 off), within the
  library's own row and group heights; this round did not measure which
  rows add it. The note and the last row are in full view. The `run in
  picker` key sits on the popover's box (#98). Since beta.9 it is
  `Popover surface="raised"`: an opaque `surface.raised` fill (#17213a),
  as Figma fills it (346:1234), so the detail no longer shows through
  it.
- **Prompt line break.** Figma breaks the editor's first line after
  "toolkit/" (346:1188); the render breaks it before
  "toolkit/rules/linear.md". The read-only prompt puts a `<wbr>` after
  each slash (PR #4), but the editor is a `textarea`, whose value is
  plain text and takes no element. No CSS rule adds a break only after
  a slash: `overflow-wrap: anywhere` breaks a word only when it does
  not fit on a line by itself, which the path does, and `word-break:
  break-all` and `line-break: anywhere` break inside any word, so the
  other lines would change too. A zero-width space after each slash
  would give the break but would go into the text Erik edits and
  copies. The break stays where the browser puts it.
- **Prompt editor.** The editor is not shown focused, so its border is
  the field border, not cyan. A story cannot focus a field without a
  user action.
- **Beta.5 (2026-11-17).** The new library parts move these layers:
  `run in picker` x +2, y +2.5, h +5 (was x +2, y +4.5, h +9);
  `section · RUN IN` within tolerance (was x +4, y +1, h +5);
  `section · SOURCES` x +4, y +5, h +2 (was x +4, y +9, h +2); `start`
  within tolerance (was x +4, y +8, h -1). The cause is the 20 px pills
  (`Badge size="sm"`, as Figma's): the Edited pill in the prompt header,
  the Recommended pill in the Run in card and the pills in the picker's
  rows (beta.4 drew them 24 px high).
- **Beta.7 (2026-11-17).** Library 1.0.0-beta.6 and beta.7 (#107,
  #108) move these layers: `group · NEXT STEPS` within tolerance (was
  x +0, y +18, w +1, h +4); `group · SNOOZED` x +0, y +5, w +1, h +2
  (was x +0, y +29, w +1, h +4). The cause is #108's compact `ListRow`
  (56 px, was 58; Figma 55) and list `GroupHeader` (36 px, was 38;
  Figma 34).
- **Beta.9 (2026-11-17).** Library 1.0.0-beta.9 (#110, #111) gives the
  Run in picker an opaque fill: `Popover surface="raised"`
  (`surface.raised`, #17213a, Figma's; was `surface.overlay`, alpha
  0.98). No layer of this frame moved. On `surface.raised`, `fg.subtle`
  is 4.39:1, below WCAG AA (d-055), so the search placeholder is
  `fg.muted` (#8a97b8), brighter than Figma's #4a5675.
- **Beta.10 (2026-11-17).** Library 1.0.0-beta.10 (#112) adds
  `SearchField surface="raised"`, which draws the placeholder and the
  clear icon in `fg.muted`; the picker's search uses it in place of the
  app's own placeholder style. The colour does not change.

## Second review

The second review of this frame was run again after PR #13, on a clean
image: the old picture had the popover of an earlier story over it,
which hid some differences. Its findings are in this file; the one it
added is "Prompt line break" above.

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

For D03 it also found:

- P1: the picker opened above Change, covered the header and the
  prompt, and cut off its note. Round 3 opens it below Change; since
  round 6 it no longer scrolls (see "Run in picker" above).
- The prompt editor has no cyan focus border or caret (see above).
- The chosen picker row had no row fill, and the picker's status pills
  had borders: fixed by `OptionList selectedFill` and the pill change
  (#98).
