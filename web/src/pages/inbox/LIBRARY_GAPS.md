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
`ListRow finished`. Library #102 closed most of the detail's small text:
`MarkdownView padding="none"`, `TextArea textSize="sm"`,
`OptionList size="sm"` and `MetaChip` and `TagsLine` at `monoSm`
(`size="sm"`). The workspace installs `1.0.0-beta.3`, which has all of
them.

## Gaps

| Part or token                 | Frames                      | What is missing                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Used now                                                                   |
| ----------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Small text in the detail      | D01–D12                     | #102 closed the mono lines, the prompt editor's text size, the option lists and the flush body text. Still open: the `Checkbox` rows of the filter menu (D04) have no small size, so they keep the `label` style against Figma's smaller text (14 px text boxes; `filter popover` h +62). The prompt editor (D03) is `TextArea textSize="sm"`, but the field pads 8 px with 20 px lines, so two lines are 60 px high against Figma's 73 (346:1188: 15.5 px inset, 21 px lines; `section · SUGGESTED PROMPT` h -11); no token has those values. List rows are 58 px against Figma's 55, because the 4 px grid rounds the 17 and 14 px text boxes to 16 (d-072). | `Checkbox` as it is, `TextArea textSize="sm"`, `ListRow density="compact"` |
| Regular 15 px text            | D08, D12                    | The prompt in the Read the whole prompt dialog (346:3548) is 15 px with 23 px lines, and the labels of the Snooze menu's 44 px rows are Regular 15. No text style has 15 px regular text (`paneTitle` is 15 px but a heading), so the dialog's prompt is in `body` (14/20) and is 38 px shorter (`346:3548` h -38, the dialog h -51), and the menu labels keep the menu's own style.                                                                                                                                                                                                                                                                           | `body`; the `Menu size="lg"` label style                                   |
| Styles that differ from Figma | D02–D05, D07, D09, D11, D12 | Seen by the second review or the position check, library styles or values with no token (d-050): `Panel tone="needsYou"` is lighter than Figma's tint; the popover (`surface.overlay`, alpha 0.98) lets the list behind it show faintly; `Composer`'s Stop icon is an outline square, not filled. D07: the result card's green border and the 0.6 fade of a done row's kind tile have no token. D09: the Sort menu's rows are 56 px against Figma's 50 (`menu · Sort` h +24). D11: a project heading is 26 px high against Figma's 24. D12: the Snooze menu is 22 px taller (`menu · Snooze or dismiss` h +22).                                                | The library parts as they are                                              |
