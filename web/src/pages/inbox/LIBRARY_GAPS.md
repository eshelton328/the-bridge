# Inbox library gaps

Parts and tokens the Inbox frames need that the component library
(`@eshelton328/component-library-1701`, the build installed in this
worktree) cannot draw. Each gap goes to the library in one batched PR
(fidelity loop, step 2). Until then the screen uses the part named under
"Used now", and the frame's `deviations.md` lists the difference.

Library main 52e3887 (#96, #97) closed the earlier rows: the detail
column size, compact filter chips, the checkbox count, popover widths,
the picker choice row, choice cards, the needs-you panel, the secondary
danger button and the prompt fade. Library main 66a44c5 (#98) closed
the mono `Checkbox` label, the sort-descending icon, the cyan running
dot of `ToolLine`, the pill borders, the card radio, the picker's row
fill and the popover's data attribute and placement. Library main 60170df
(#99) added the 13 and 11 px text styles: the list rows use
`ListRow density="compact"` and the detail's WHY, prompt and context use
`bodySm`. Library main 11696bc (#101) closed the D06 to D12 rows: the
Sort menu's note and width, the Snooze menu's width and 44 px rows,
`data-*` on `Menu`, `RadioMenu` and `Dialog`, `CalendarIcon`,
`Dialog size="wide"` with `headerAction`, `Panel tone="accent"`,
`GroupHeader variant="project"`, `CloseCircleIcon` with
`SearchField clearSize`, `Highlight variant="colour"` and
`ListRow finished`. The workspace installs `1.0.0-beta.2`, which has
all of them.

## Gaps

| Part or token                 | Frames                      | What is missing                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Used now                                                                |
| ----------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Small text in the detail      | D01–D12                     | #99 closed the rows and the body text. Still at 14 and 12 px where Figma has 13 and 11: the detail's mono lines (task bar, chips, run line, 11 px in Figma), the prompt editor (`TextArea` has no small size, D03), the `OptionList` card descriptions (D02) and the `Checkbox` rows of the filter menu (D04). Rows are 58 px against Figma's 55, because the 4 px grid rounds the 17 and 14 px text boxes to 16 (d-072). `MarkdownView size="sm"` has the body style but pads 20 by 24 px and takes no class, so a detail section cannot use it flush.                                                         | `ListRow density="compact"`, `bodySm` through `css()`, the `mono` style |
| Regular 15 px text            | D08, D12                    | The prompt in the Read the whole prompt dialog (346:3548) is 15 px with 23 px lines, and the labels of the Snooze menu's 44 px rows are Regular 15. No text style has 15 px regular text (`paneTitle` is 15 px but a heading), so the dialog's prompt is in `body` (14/20) and is 38 px shorter (`346:3548` h -38, the dialog h -51), and the menu labels keep the menu's own style.                                                                                                                                                                                                                            | `body`; the `Menu size="lg"` label style                                |
| Styles that differ from Figma | D02–D05, D07, D09, D11, D12 | Seen by the second review or the position check, library styles or values with no token (d-050): `Panel tone="needsYou"` is lighter than Figma's tint; the popover (`surface.overlay`, alpha 0.98) lets the list behind it show faintly; `Composer`'s Stop icon is an outline square, not filled. D07: the result card's green border and the 0.6 fade of a done row's kind tile have no token. D09: the Sort menu's rows are 56 px against Figma's 50 (`menu · Sort` h +24). D11: a project heading is 26 px high against Figma's 24. D12: the Snooze menu is 22 px taller (`menu · Snooze or dismiss` h +22). | The library parts as they are                                           |
