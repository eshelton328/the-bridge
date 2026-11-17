# D03 deviations

What still differs from Figma after round 3 of the fidelity loop
(`pnpm fidelity inbox D03`, 2026-11-16, library main 66a44c5), each with
its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass, with one exception in `exceptions.json` (the "|" Figma draws as the editor's caret).
- Position: 8 of 16 layers pass (`inbox list`, `header`, `filter · chips`, `list tools`, `group · NEEDS YOU`, `task pane`, `task bar`, `title block`).
- Rules: fail. `hiddenOverflow` on `[data-figma="run in picker"]`: the Run in picker scrolls and its last row and note are cut off (below).

## Deviations

- **List row heights.** Rows are 62 px instead of 55 px: Figma's row
  uses smaller text (17 px title, 14 px meta) than the library's `label`
  and `mono` styles (Figma sets rows and body in 13 px and meta in 11;
  the library's `label`, `body` and `mono` are 14 and 12, an open
  decision for Erik). Line heights stay as the tokens set them (d-072), so
  each group below Needs you starts lower (NEXT STEPS y +34, SNOOZED y +57).
- **Group headers.** 38 px high against Figma's 34 (`h +4` on each group
  header): the library's `GroupHeader` after the 4 px grid (#96).
- **Detail text.** Figma's body and mono text in the detail is narrower
  than the library's `body` and `mono` styles, so lines wrap sooner:
  WHY takes two lines and the prompt editor three against Figma's two. Each extra line moves the sections below it down.
- **Section gaps.** Sections are 24 px apart against Figma's 22; 22 has
  no spacing token and ties go to the larger (d-072).
- **Detail inset.** The column starts at x 524 instead of 520: the
  library's `Container size="detail"` pads 40 px where Figma has 36
  (d-072 tie). Within the 4 px tolerance.
- **Run in picker is cut off at the bottom.** The picker now keeps
  `placement="bottom-end"` (`flip={false}`, #98) and opens below Change,
  as in Figma. The detail above it is 41 to 53 px lower than Figma's
  (RUN IN y +41, `start` y +52), so the picker starts 46.5 px lower
  (`run in picker` y +46.5) and the frame's bottom leaves it 453 px for
  478 px of content: it scrolls, and the drift check row and the note
  "Shells are not listed…" are cut off. Not fixed: the cause is the text
  size above. No exception was added because the render is wrong here.
  The `run in picker` key now sits on the popover's box (#98).
- **Prompt editor.** The editor is not shown focused, so its border is
  the field border, not cyan. A story cannot focus a field without a
  user action.

## Second review

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
  prompt, and cut off its note. Round 3 opens it below Change; it is
  still cut off at the bottom (see "Run in picker" above), which the
  rules check reports.
- The prompt editor has no cyan focus border or caret (see above).
- The chosen picker row had no row fill, and the picker's status pills
  had borders: fixed by `OptionList selectedFill` and the pill change
  (#98).
