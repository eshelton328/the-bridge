# D08 deviations

What still differs from Figma after the last round of the fidelity loop
(`pnpm fidelity toolkit D08`, 2026-11-17, against the installed library
1.0.0-beta.15), each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/workflowOpen.ts`: D9's list data (only the
Rules, Workflows and Hooks groups), and the workflow skill-eval-round
open beside it. D03, D04, D07 and D09 give the same results as before D08
(D03: text fail with the same four strings, 15 of 53 layers; D04: text
pass, 15 of 49 layers; D07: text pass, 21 of 36 layers; D09: text fail
with the same three strings, 21 of 43 layers, the same `hiddenOverflow`
on the list pane; D03, D04 and D07 rules pass).

The workspace stays on library 1.0.0-beta.15: no part of beta.16
(TerminalLines, EmptyPane, DragPreview, Popover `width="xs"`, OptionList
`labelStyle="mono"` and `check={false}`) draws a part of D8.

## Checks

- Text: fail. Three strings are not visible: `commit-msg`,
  `hooks/commit-msg` and `→1 ←1` (433:940, 433:941, 433:943), the hook's
  list row, which the render draws below the frame's bottom edge (see
  Row height). No text is covered by another element. In
  `exceptions.json`: the Workflows chip's label and count (433:810,
  433:811), which Figma cuts at the list pane's edge too.
- Position: 29 of 52 layers pass (`toolkit list`, `header`, `read-only`,
  `filter · chips`, `search`, `group · RULES`, `toolkit item`,
  `meta row`, `kind badge`, `button · Discuss`, `button · Show on map`,
  `433:1032`, `path row`, `path badge`, `kind section · workflow`,
  `steps header`, `flow · by phase`, all ten step cards, `runs`,
  `link · eval-grader`).
- Rules: fail. One `hiddenOverflow` finding: the list pane
  (`[data-figma="toolkit list"]`) is 1066 px high in a 982 px frame and
  scrolls, because of the taller rows (see Row height), as in D9. In
  `exceptions.json`: the kind chips scroll sideways, cut at the pane's
  edge (`[data-figma="filter · chips"] > div.filter-chips__root`).

## Deviations

- **Row height.** Each list row is 62 px high against Figma's 53 (the
  open row is 62 against 55), and its counts sit level with the name,
  where Figma centres them. `ListRow` pads 10 inside a 1 px border (gap:
  Toolkit row (pane)). The first row starts 3 px lower and each row
  after it 9 px lower again:
  `toolkit row · commits-and-prs` y +3 h +9;
  `toolkit row · diagrams` y +12 h +9; `toolkit row · linear` y +21
  h +9; `toolkit row · readmes` y +30 h +9; `toolkit row · releases`
  y +39 h +9; `toolkit row · skills` y +48 h +9;
  `toolkit row · ste100` y +57 h +9; `toolkit row · writing` y +66 h +9;
  `group · WORKFLOWS` y +75; `toolkit row · skill-eval-cases` y +78 h +9;
  `toolkit row · skill-eval-round` y +87 h +7; `group · HOOKS` y +94;
  `toolkit row · commit-msg` y +97 h +9. The hook's row starts at 988,
  below the frame's bottom edge (982), so its name, path and counts
  (`commit-msg`, `hooks/commit-msg`, `→1 ←1`) are not visible and the
  list pane scrolls (`hiddenOverflow` on `[data-figma="toolkit list"]`).
  No page builds its own scroll layout (d-107).
- **Connector lines.** The library has no line between steps (gap:
  Workflow flow by phase). The render draws each arrow as the library's
  12 px `ArrowDownIcon` or `ArrowRightIcon` with no line: down between
  the steps of Run and Decide, across into Run (under `yes`), into both
  Grade steps and into Aggregate. Figma's elbows (Blinding up into both
  grades, both grades into Aggregate), the long `no` line from
  Pre-registered? down to Stop (the render shows `no` over a short down
  arrow in the empty row) and the dashed amber loop from Owner decides
  back to Stop are not drawn; the loop's label `new failure` sits alone
  under the lanes, centred as Figma's.
- **Step cards.** `FlowDiagram` numbers its steps itself and puts the
  body beside the number, so the cards are drawn with its card's tokens
  (gap: Workflow flow by phase): 10 px padding against Figma's 11, the
  marks as `Badge variant="outline"` (a gate's `?` as
  `variant="tag" tone="needsYou"`), 22 px high against 19. All ten cards
  are 82 px high and pass the position check. Stop's dashed border uses
  the needs-you border colour on the card fill.
- **Lanes.** The flow box pads 12 at the sides against Figma's 14 (no
  space token has 14), so each lane is 212.5 px wide against 212; the
  cards pass the position check.
- **Loop label.** `new failure` is a `Badge variant="tag"
  tone="needsYou"`, 91 × 21 against Figma's bordered pill of 98 × 23
  (`label · new failure` x +3.4 y -2.5 w -6.8).
- **Open full page.** `Button size="sm" textSize="sm"` with the 16 px
  `ExternalLinkIcon` is 127.5 × 28 against Figma's 122 × 29 with a 13 px
  icon (`button · Open full page` x -5.5 w +5.5). It sets
  `ui.flowFullPage`; D13, the full page, is a later frame.
- **Rendered file.** The rendered skill-eval-round.md is 17 px taller
  than Figma's (`columns` h +17, `file preview` h +17,
  `rendered markdown` h +17): `MarkdownView` spaces its title,
  paragraphs and heading on the 4 px grid (d-072), as in D7. To keep the
  item inside the frame with no scroll, the item pane pads 24 under its
  content (it was 40); the item fills the frame's height in every other
  frame, so D3, D4, D7 and D9 do not change.
- **Overview columns.** The preview is 554.4 px wide against Figma's 560
  and the side column 369.6 against 364, so the side starts 5.6 px
  further left. No size token has 560 or 364, and the grid shares the
  row 3 to 2 (gap: Item overview columns): `file preview` w -5.6,
  `preview bar` w -5.6, `rendered markdown` w -5.6, `side` x -5.6
  w +5.6, `files` x -5.6, `file · skill-eval-round.md` x -5.6 y +4 (gap:
  Item file summary: 16 px icons against 14 and the 16 px `mono` line).
- **Description width.** The description is 948 px wide, the content
  width, against Figma's 940 (`433:1033` y -2 w +8): Figma's text box
  ends at its longest line, and the render's paragraph fills its column.
  It is one line in both.
- **All chip.** The render draws All as the selected chip, because the
  filter is All; Figma D8 draws no chip selected, as D3, D4, D7 and D9
  do. The app keeps one rule for every frame: the chip of the current
  filter is selected.
- **Buttons, copy button, preview bar.** As in D3, D4, D7 and D9: Discuss
  and Show on map are both 32 px high against Figma's 34 and 36 (gap:
  Item action buttons); the copy icon is a plain button with `CopyIcon`
  (gap: Path badge copy button); the preview box and bar are drawn with
  the Panel's tokens, with a 16 px file icon against 14 (gap: File
  preview). The three pass the position check.
- **Other tabs.** How it works, Files, Links, Evals and Activity show
  empty panels: they are later frames.

## Second review

- **Gate fill.** The reviewer saw Pre-registered? and Owner decides filled
  with an amber tint, where Figma draws only the amber border and title
  on the card's own fill. Fixed: a gate now keeps the card's fill.
