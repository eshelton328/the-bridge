# D02 deviations

What still differs from Figma after three rounds of the fidelity loop
(`pnpm fidelity inbox D02`, 2026-11-16), each with its reason. The
library gaps are in `web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: fails only on "Done" not visible (filter chips, below).
- Position: 5 of 14 layers pass (`inbox list`, `header`, `list tools`, `group · NEEDS YOU`, `task pane`).
- Rules: pass.

## Deviations

- **Detail width.** Every detail layer is 948 px wide instead of 748 px
  (`task bar`, `title block` and each section, w +200). Library limit: no
  size token holds the 748 px cap, and the repo forbids raw values.
- **List row heights.** Rows are 63 px instead of 55 px (title 20 px,
  meta 17 px against Figma's 17 and 14), so each group below Needs you
  starts lower (NEXT STEPS y +39, SNOOZED y +66). Token rounding (d-072): the `label` and `mono`
  line heights.
- **Filter chips.** The chip row is 36 px high (chips 32 px against 30)
  and "Done" is cut off at the pane edge (`text.notVisible`). Library
  limit: `FilterChips` has one size, `control.md` with 14 px labels, and
  the five chips need about 466 px of the pane's 395.
- **Deny button.** A red-filled `dangerSoft` button instead of a
  secondary button with a red label. Library limit: no such variant.
- **Waiting box.** Neutral border and fill instead of Figma's needs-you
  border and tint, and 10 px taller (`blocking`). Library limit: `Panel`
  has no tone.
- **Options.** Flat `OptionList` rows with a check at the end, instead of
  bordered cards with a leading radio (`section · CHOOSE ONE` h -33).
  Library limit: no choice card part.
- **Section offsets.** CONTEXT and CHOOSE ONE start 21 and 24 px lower,
  for the reasons of the waiting box and the 24 px section gap (d-072).
