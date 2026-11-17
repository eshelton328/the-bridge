# D04 deviations

What still differs from Figma after three rounds of the fidelity loop
(`pnpm fidelity inbox D04`, 2026-11-16), each with its reason. The
library gaps are in `web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: fails only on "Done" not visible (filter chips, below); the hidden "Run the readme" row is excepted in `exceptions.json`.
- Position: 5 of 15 layers pass (`inbox list`, `header`, `list tools`, `group · NEEDS YOU`, `task pane`).
- Rules: pass.

## Deviations

- **Detail width.** Every detail layer is 948 px wide instead of 748 px
  (`task bar`, `title block` and each section, w +200). Library limit: no
  size token holds the 748 px cap, and the repo forbids raw values.
- **List row heights.** Rows are 63 px instead of 55 px (title 20 px,
  meta 17 px against Figma's 17 and 14), so each group below Needs you
  starts lower (NEXT STEPS y +41, SNOOZED y +58). Token rounding (d-072): the `label` and `mono`
  line heights.
- **Filter chips.** The chip row is 36 px high (chips 32 px against 30)
  and "Done" is cut off at the pane edge (`text.notVisible`). Library
  limit: `FilterChips` has one size, `control.md` with 14 px labels, and
  the five chips need about 466 px of the pane's 395.
- **Deny button.** A red-filled `dangerSoft` button instead of a
  secondary button with a red label. Library limit: no such variant.
- **Filter menu.** 320 px wide instead of 300 and 17 px lower
  (`filter popover` x -10, y +17): `Popover` is fixed at
  `shell.popover`, and the Filter button sits 4 px lower in its row.
  Each count is a mono span beside the `Checkbox`, which has no count
  slot. Rows are 34 px apart against 30 (the `body` line height).
- **Section offsets.** The sections start 9 to 20 px lower (title block
  line heights and the 24 px section gap, d-072).
