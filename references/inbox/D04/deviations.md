# D04 deviations

What still differs from Figma after round 3 of the fidelity loop
(`pnpm fidelity inbox D04`, 2026-11-16, library main 66a44c5), each with
its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass; the hidden "Run the readme" row is excepted in `exceptions.json`.
- Position: 8 of 16 layers pass (`inbox list`, `header`, `filter · chips`, `list tools`, `group · NEEDS YOU`, `task pane`, `task bar`, `title block`).
- Rules: pass.

## Deviations

- **List row heights.** Rows are 62 px instead of 55 px: Figma's row
  uses smaller text (17 px title, 14 px meta) than the library's `label`
  and `mono` styles (Figma sets rows and body in 13 px and meta in 11;
  the library's `label`, `body` and `mono` are 14 and 12, an open
  decision for Erik). Line heights stay as the tokens set them (d-072), so
  each group below Needs you starts lower (NEXT STEPS y +34, SNOOZED y +50).
- **Group headers.** 38 px high against Figma's 34 (`h +4` on each group
  header): the library's `GroupHeader` after the 4 px grid (#96).
- **Detail text.** Figma's body and mono text in the detail is narrower
  than the library's `body` and `mono` styles, so lines wrap sooner:
  WHY takes two lines. Each extra line moves the sections below it down.
- **Section gaps.** Sections are 24 px apart against Figma's 22; 22 has
  no spacing token and ties go to the larger (d-072).
- **Detail inset.** The column starts at x 524 instead of 520: the
  library's `Container size="detail"` pads 40 px where Figma has 36
  (d-072 tie). Within the 4 px tolerance.
- **Filter menu.** 300 px wide (`Popover width="filter"`) with the counts
  in `Checkbox trailing`. Rows are 34 px apart against 30 (the `label`
  line height and the 16 px box against Figma's 14), so the menu is 62 px
  taller (`filter popover` h +62). The project and tag labels are mono
  (`Checkbox labelStyle="mono"`, #98). The `filter popover` key now sits
  on the popover's box (#98); the box starts 6 px lower than Figma's
  (y +6).
- **Section offsets.** WHY starts 6 px lower and the sections after it 28
  to 40 px lower, from the title block, the WHY wrap and the gaps.

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

For D04 it also found:

- Project and tag labels in sans, not mono: fixed in round 3
  (`labelStyle="mono"`).
- The menu is 62 px taller (rows 34 px apart against 30) and its counts
  sit 9 px further right and are brighter: the `Checkbox` size and type
  sizes.
- The list shows faintly through the menu: `surface.overlay` has alpha
  0.98 (library style).
