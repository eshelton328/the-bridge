# D05 deviations

What still differs from Figma after three rounds of the fidelity loop
(`pnpm fidelity inbox D05`, 2026-11-16), each with its reason. The
library gaps are in `web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: fails only on "Done" not visible (filter chips, below).
- Position: 5 of 10 layers pass (`inbox list`, `header`, `list tools`, `group · NEEDS YOU`, `task pane`).
- Rules: pass.

## Deviations

- **Detail width.** Every detail layer is 948 px wide instead of 748 px
  (`task bar`, `title block` and each section, w +200). Library limit: no
  size token holds the 748 px cap, and the repo forbids raw values.
- **List row heights.** Rows are 63 px instead of 55 px (title 20 px,
  meta 17 px against Figma's 17 and 14), so each group below Needs you
  starts lower (NEXT STEPS y +41, SNOOZED y +60, RUNNING y +63). Token rounding (d-072): the `label` and `mono`
  line heights.
- **Filter chips.** The chip row is 36 px high (chips 32 px against 30)
  and "Done" is cut off at the pane edge (`text.notVisible`). Library
  limit: `FilterChips` has one size, `control.md` with 14 px labels, and
  the five chips need about 466 px of the pane's 395.
- **Deny button.** A red-filled `dangerSoft` button instead of a
  secondary button with a red label. Library limit: no such variant.
- **Started task header.** 948 px wide (`started task` w +200); the
  Working pill sits right after the meta line's end at the panel edge.
  Library limit: the detail width above.
- **Running row.** The kind mark before "quiet-nebula · Creating 9
  issues…" is 14 px against Figma's 12: the installed `KindMark` sizes
  are 14, 16 and 20.
