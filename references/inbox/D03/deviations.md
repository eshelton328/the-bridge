# D03 deviations

What still differs from Figma after round 2 of the fidelity loop
(`pnpm fidelity inbox D03`, 2026-11-16, library main 52e3887), each with
its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass, with one exception in `exceptions.json` (the "|" Figma draws as the editor's caret).
- Position: 8 of 16 layers pass (`inbox list`, `header`, `filter · chips`, `list tools`, `group · NEEDS YOU`, `task pane`, `task bar`, `title block`).
- Rules: fail. `hiddenOverflow` on `div.popover__content`: the Run in picker's last line is cut off (below).

## Deviations

- **List row heights.** Rows are 62 px instead of 55 px: Figma's row
  uses smaller text (17 px title, 14 px meta) than the library's `label`
  and `mono` styles. Line heights stay as the tokens set them (d-072), so
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
- **Run in picker opens upward and is cut off.** The detail above it is
  41 to 53 px lower than Figma's (RUN IN y +41, `start` y +52), so the
  space under Change is too short for the 380 px picker. Ark flips it
  above the button, where `Popover` holds it to the space above, and its
  scroll box hides the note "Shells are not listed…" (`run in picker` y
  -455.5, h -21). Not fixed: the cause is the text size above, and the
  library's `Popover` has no way to keep a placement. No exception was
  added because the render is wrong here.
  The `run in picker` key sits on the popover's content, inside its 8 px padding and
  1 px border, because `Popover` takes no data attribute for its box; that accounts
  for x +11 and w -18.
- **Prompt editor.** The editor is not shown focused, so its border is
  the field border, not cyan. A story cannot focus a field without a
  user action.

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

For D03 it also found:

- P1: the picker opens above Change, covers the header and the prompt,
  and cuts off its note. Not fixed; see "Run in picker" above. The rules
  check now reports it.
- The prompt editor has no cyan focus border or caret (see above).
- The chosen picker row has no row fill, and the picker's status pills
  have borders: library styles.
