# Inbox library gaps

Parts and tokens the Inbox frames need that the component library
(`@eshelton328/component-library-1701`, the build installed in this
worktree) cannot draw. Each gap goes to the library in one batched PR
(fidelity loop, step 2). Until then the screen uses the part named under
"Used now", and the frame's `deviations.md` lists the difference.

| Part or token | Frames | What is missing | Used now |
| --- | --- | --- | --- |
| Size token for the detail column | D01–D05 | Figma caps the task column at 748 px (820 with its 36 px sides, 346:306). No size token has 748 or 820; the library's `Container` says so ("No max width"). | `Container size="desktop"`, full width of the detail pane (948 px) |
| `FilterChips` compact size | D01–D05 | Figma's chips are 30 px high with 9 px sides, a 5 px gap and 13 px labels (346:152). The library's only chip is `control.md` (32) high with 12 px sides and the 14 px `label` style, so the five chips need about 466 px and the 395 px pane cuts off "Done". | `FilterChips`; the row scrolls and "Done" is cut |
| `Checkbox` with a trailing count | D04 | Each row of the Filter menu shows its count at the end (346:1747). `Checkbox` has no trailing slot. | `Checkbox` in an `Inline` with a mono count |
| `Popover` width | D03, D04 | The Filter menu is 300 px (346:1737) and the Run in picker 380 px (346:1234). The popover content is fixed at `shell.popover` (320 px). | `Popover` at 320 px |
| Picker choice row | D03 | A Run in choice has a leading kind mark (Claude or Codex), a title with a pill, a mono meta line and, at the end, a check or a status pill (346:1243, 346:1273). `OptionList` has no leading slot, puts the pill beside the title, and its meta line is `small`, not mono. "New chat in another workspace…" has a leading plus. | `OptionList`, with the pill in its `badge` |
| Choice card with a radio | D02 | The options of a question are bordered cards with a leading radio, the chosen one outlined in cyan (346:789). `OptionList` draws flat rows with a trailing check. | `OptionList` |
| `Panel` needs-you tone | D02 | The "waiting for this answer" box has a needs-you border and tint (346:772). `Panel` has one look. | `Panel` |
| `Button` secondary with a danger label | D01–D05 | Deny in an approval row is a secondary button with a red label (346:213). The library has `dangerSoft` (red fill) and `dangerText` (no box). | `dangerSoft` |
| Prompt fade | D01 | A long prompt ends in a fade (346:372) before "Read the whole prompt". | No fade; the whole prompt shows |
| Line heights of `label` and `mono` | D01–D05 | A list row is 55 px in Figma (17 px title, 14 px meta); with the installed tokens it is 63 px, so each group below the first starts lower. This is the line-height rounding of d-072, not a missing part; listed here because it moves every row. | `ListRow` |
