# D14 deviations

What still differs from Figma after round 3 of the fidelity loop
(`pnpm fidelity toolkit D03 D04 D07 D08 D09 D14`, 2026-11-17, against the
installed library 1.0.0-beta.20), each with its reason. The library gaps
are in `web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/skillHowItWorks.ts`: D3's data (the list has
T1's data), with writer open on its How it works tab. D03, D04, D07, D08
and D09 give the same results as before D14 (each report's text, position
and rule results are unchanged). The frame has no `exceptions.json`.

## Checks

- Text: fail. Every Figma string is in the render, and no text is covered
  by another element. Six strings are not visible:
  - `Workflows` and `2` (459:181, 459:182), the Workflows chip, which the
    chip row cuts at the list pane's edge, as Figma does (see Kind chips).
  - `agents/eval-case-writer.md` (459:296), and `eval-grader`,
    `agents/eval-grader.md` and `→0 ←2` (459:305, 459:306, 459:308): the
    taller list rows push them past the frame's bottom edge (see Row
    height).
- Position: 41 of 68 layers pass, among them every layer of the How it
  works tab but two: `how it works`, `459:599` (its header), the four
  legend items, `steps`, all eight step cards (`step 1` to `step 8`), all
  six use chips (`uses · references/<form>.md`, `uses · ste100`,
  `uses · scripts/check`, `uses · writing-reviewer`, `uses · omni audit`,
  `uses · audit-slop`) and `source`; and `toolkit list`, `read-only`,
  `filter · chips`, `search`, `group · SKILLS`, `toolkit item`,
  `meta row`, `kind badge`, both buttons, `459:367`, `path row` and
  `path badge`.
  The shared navigation's items pass too: `rail · Inbox`,
  `rail · Workspaces`, `rail · Projects`, `rail · Artifacts`,
  `rail · Toolkit` and `rail · More`.
- Rules: fail. Two `hiddenOverflow` findings: the list pane scrolls on its
  own (`[data-figma="toolkit list"]`), and the kind chips scroll sideways
  (`[data-figma="filter · chips"] > div.filter-chips__root`). D03 has the
  same two in its `exceptions.json`; this frame takes no exceptions.

## Deviations

- **Trigger box.** The box that says when writer loads is 38 px high
  against Figma's 31 (`trigger` h +7), on the pane fill with no green
  tint: `Panel variant="notice" tone="done"` pads 10/12 where Figma has
  7/11 (gap: How it works trigger). It starts 2 px higher than the other
  rows' spacing would put it, so it and the steps stay within 4 px.
- **Chat path.** The chat path box is 182 px high against Figma's 175
  (`chat path` h +7): the library's `ChatPath` draws its pills and rows a
  little taller (gap: How it works steps). The source line sits 8 under
  it, not 12, so it stays at Figma's y.
- **Step arrows.** The library has no line between steps (gap: How it
  works steps). Between the cards of a row the render draws the 16 px
  `ArrowRightIcon` alone, where Figma draws a 38 px line with a head
  (`arrow` 460:96 to 460:101). Figma's elbow from step 4 down, back across
  and into step 5 (`arrow` 460:102) is only the 16 px `ArrowDownIcon`
  over step 5.
- **Step cards.** `FlowDiagram` lays its steps out top to bottom with the
  number beside the body, so the cards are drawn with its card's tokens
  in a four-column grid (gap: How it works steps). The cards are 146 px
  high against 148 (within the tolerance), and the number is a
  `Badge variant="outline"`, 22 px high against Figma's 19.
- **Use chips.** The chips' text is grey (`status.idle.fg`) where Figma
  colours it by what the step uses: `ste100` amber, `scripts/check` and
  `omni audit` cyan, `writing-reviewer` purple. Only the icon takes the
  colour (gap: How it works use chip). The chips are 22 px high against
  23; all six pass the position check.
- **Box spacing.** Figma pads the How it works box 18 at the sides and
  spaces its rows 14 apart; no space token has 18 or 14, so the render
  uses the Panel's padding with 4 and 2 more and rows 12 apart (gap: How
  it works box spacing). Every row is within 4 px of Figma's.
- **Header key.** Two Figma layers are named `header`: the list's
  (459:154) and the How it works header (459:599). The How it works
  header carries its node id, but the list pane's `ToolkitHeader` carries
  `header` in every frame, so the check finds `header` ambiguous. Its
  name is right in D03, D04, D07, D08 and D09, which have one `header`.
- **Item tabs.** The selected tab, How it works, is white with a grey
  outline where Figma's is cyan, and the tabs are spaced wider, so
  Activity starts further right (gaps: Item tab selected tone, Item tab
  spacing). A later PR sets the beta.21 props.
- **Row height.** Each list row is 62 px high against Figma's 53 (the
  open row is 62 against 55), and its counts sit level with the name,
  where Figma centres them. `ListRow` pads 10 inside a 1 px border (gap:
  Toolkit row (pane)). The first row starts 3 px lower and each row after
  it 9 px lower again: `toolkit row · agents-md` h +9;
  `toolkit row · ambitious` y +12 h +9; `toolkit row · audit-slop` y +21
  h +9; `toolkit row · eval-cases` y +30 h +9;
  `toolkit row · mermaid-diagrams` y +39 h +9;
  `toolkit row · pr-description` y +48 h +9;
  `toolkit row · project-setup` y +57 h +9; `toolkit row · readme` y +66
  h +9; `group · AGENTS` y +82; `toolkit row · diagram-reviewer` y +85
  h +9; `toolkit row · eval-case-writer` y +94 h +9;
  `toolkit row · eval-grader` y +103 h +9;
  `toolkit row · pr-description-checker` y +112 h +9;
  `toolkit row · readme-cold-reader` y +121 h +9;
  `toolkit row · writing-reviewer` y +139 h +9. The list pane is taller
  than the frame and scrolls (`hiddenOverflow` on
  `[data-figma="toolkit list"]`), and the last rows' text is below the
  frame's bottom edge. No page builds its own scroll layout (d-107). The
  selected writer row has no `data-figma`: the agent writer shares the
  layer name `toolkit row · writer`.
- **Rules group.** The list has T1's data, as D3's does, so the Rules
  group and its eight rows are drawn below the Agents rows, past the
  frame's bottom; Figma's list runs on past the frame too, and the frame
  has no layer for them: `group · RULES`,
  `toolkit row · commits-and-prs`, `toolkit row · diagrams`,
  `toolkit row · linear`, `toolkit row · readmes`,
  `toolkit row · releases`, `toolkit row · skills`,
  `toolkit row · ste100`, `toolkit row · writing`.
- **Kind chips.** The chip row runs past the list pane's edge and
  scrolls sideways (`hiddenOverflow` on
  `[data-figma="filter · chips"] > div.filter-chips__root`), so the
  Workflows chip's label and count (`Workflows`, `2`) are cut, as Figma
  cuts them after the chip's dot (459:179).
- **All chip.** The render draws All as the selected chip, because the
  filter is All; Figma D14 draws no chip selected, as D3 does. The app
  keeps one rule for every frame: the chip of the current filter is
  selected.
- **Buttons, copy button.** As in D3: Discuss and Show on map are both
  32 px high against Figma's 34 and 36 (gap: Item action buttons), and
  the copy icon is a plain button with `CopyIcon` (gap: Path badge copy
  button). Both pass the position check.
- **Other tabs.** Files, Links, Evals and Activity show empty panels:
  they are later frames.

## Second review

- **Row counts.** The two change counts in each list row sit level with
  the name, where Figma centres them in the row, as on D03 (gap: Toolkit
  row (pane)).
- **Rail items.** The rail items from Inbox to More sit 4 to 5 px higher
  under the logo than Figma's. The rail is the shared app frame; this is
  reported to bridge-coord for the cross-page audit.
