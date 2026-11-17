# D03 deviations

What still differs from Figma after three rounds of the fidelity loop
(`pnpm fidelity inbox D03`, 2026-11-16), each with its reason. The
library gaps are in `web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass, with one exception in `exceptions.json` (the "|" Figma draws as the editor's caret).
- Position: 5 of 15 layers pass (`inbox list`, `header`, `list tools`, `group · NEEDS YOU`, `task pane`).
- Rules: pass.

## Deviations

- **Detail width.** Every detail layer is 948 px wide instead of 748 px
  (`task bar`, `title block` and each section, w +200). Library limit: no
  size token holds the 748 px cap, and the repo forbids raw values.
- **List row heights.** Rows are 63 px instead of 55 px (title 20 px,
  meta 17 px against Figma's 17 and 14), so each group below Needs you
  starts lower (NEXT STEPS y +41, SNOOZED y +66). Token rounding (d-072): the `label` and `mono`
  line heights.
- **Filter chips.** The chip row is 36 px high (chips 32 px against 30)
  and "Done" is cut off at the pane edge (`text.notVisible`). Library
  limit: `FilterChips` has one size, `control.md` with 14 px labels, and
  the five chips need about 466 px of the pane's 395.
- **Deny button.** A red-filled `dangerSoft` button instead of a
  secondary button with a red label. Library limit: no such variant.
- **Done chip.** The text check passes on "Done" here only because the
  prompt editor's Done button shows the same word; the chip is still
  cut off, as in D01.
- **Run in picker.** 320 px wide instead of 380, and it opens under the
  Change button at the right of the 948 px column (`run in picker` x
  +271, w -78). Library limits: `Popover` is fixed at `shell.popover`,
  and the detail width above. The choices have no kind marks, the pills
  sit beside the titles instead of at the end, and "New chat in another
  workspace…" has no plus icon: `OptionList` has no leading or trailing
  slot.
- **Prompt editor.** The editor is not shown focused, so its border is
  the field border, not cyan. A story cannot focus a field without a
  user action.
- **Section offsets.** START and SOURCES start 13 and 14 px lower (title
  block line heights and the 24 px section gap, d-072).
