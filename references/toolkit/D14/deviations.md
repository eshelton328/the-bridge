# D14 deviations

What still differs from Figma after round 3 of the fidelity loop
(`pnpm fidelity toolkit D03 D04 D07 D08 D09 D14`, 2026-11-17, against the
installed library 1.0.0-beta.20), each with its reason. The library gaps
are in `web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/skillHowItWorks.ts`: D3's data (the list has
T1's data), with writer open on its How it works tab. D03, D04, D07, D08
and D09 give the same results as before D14 (each report's text, position
and rule results are unchanged). The frame's `exceptions.json` excepts the
strings and the `hiddenOverflow` findings below, each with the entry that
records it; with them the text and rules checks now pass. The Checks below
are from a rerun with library 1.0.0-beta.25 and the item tabs' `tone` and
`density` props (2026-11-17).

## Checks

From `pnpm fidelity toolkit` on 2026-11-18, after the list rows moved to
`ListRow padding="pane"` and the pane's kind chips to `FilterChips
fade="none"` (library 1.0.0-beta.65), with the frame's
`exceptions.json`.

- Text: pass. `exceptions.json` excepts 2 Figma strings (`Workflows`,
  `2`); each is explained below.
- Position: 49 of 68 layers pass. The 19 that fail: `header`
  ambiguousLayer; `group · AGENTS` y -8; `toolkit row ·
  diagram-reviewer` y -5; `toolkit row · eval-case-writer` y -6;
  `toolkit row · eval-grader` y -7; `toolkit row ·
  pr-description-checker` y -8; `toolkit row · readme-cold-reader` y -9;
  `toolkit row · writing-reviewer` y -11; `group · RULES` noLayer;
  `toolkit row · commits-and-prs` noLayer; `toolkit row · diagrams`
  noLayer; `toolkit row · linear` noLayer; `toolkit row · readmes`
  noLayer; `toolkit row · releases` noLayer; `toolkit row · skills`
  noLayer; `toolkit row · ste100` noLayer; `toolkit row · writing`
  noLayer; `trigger` h +7; `chat path` h +7. Each is explained below.
- Rules: pass. 2 findings are excepted in `exceptions.json`:
  `hiddenOverflow` on `[data-figma="toolkit list"]`; `hiddenOverflow` on
  `[data-figma="filter · chips"] > div.filter-chips__root`.

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
- **Item tabs.** `ItemTabs tone="accent"` (library #126, beta.21) draws
  the selected tab's label, How it works, cyan, as Figma's. The outline
  stays `border.selected` at half alpha where Figma's is solid cyan (no
  solid selected token, d-050). The desktop keeps the default density:
  12 px sides and 4 apart, as Figma's, and since library #153 (beta.42)
  each tab is within 1.1 px of Figma's width: the list's 2 px inset puts
  Overview at 526 against 524, and Activity ends at 988.3 against 989.
- **Row height.** Each list row is 52 px high against Figma's 53, and
  the open item's row 52 against its 55 (`ListRow padding="pane"`,
  library 1.0.0-beta.65); 53 and 55 are off the 4 px grid (d-100), so 52
  is the decision. The kind tile, the name over the path and the counts
  sit centred down the row, as in Figma; the tile is 11 px in against
  Figma's 10, since 10 needs a 9 px padding that no space token has
  (gap: Toolkit row (pane)). Each row starts higher than Figma's by 1 px
  for each row above it and 3 px after the open item's row, and the
  group headers are 3 px taller than Figma's 27. The keys past the
  tolerance: `group · AGENTS` y -8; `toolkit row · diagram-reviewer` y
  -5; `toolkit row · eval-case-writer` y -6; `toolkit row · eval-grader`
  y -7; `toolkit row · pr-description-checker` y -8; `toolkit row ·
  readme-cold-reader` y -9; `toolkit row · writing-reviewer` y -11. With
  the shorter rows the last rows' text (`agents/eval-case-writer.md`,
  `eval-grader`, `agents/eval-grader.md`, `→0 ←2`) lies above the
  frame's foot and is visible, so its exceptions are gone. The list
  still runs past the frame's foot, so the pane scrolls on its own
  (`hiddenOverflow` on `[data-figma="toolkit list"]`, in
  `exceptions.json`). The selected writer row has no `data-figma`: the
  agent writer shares the layer name `toolkit row · writer`.
- **Rules group.** The list has T1's data, as D3's does, so the Rules
  group and its eight rows are drawn below the Agents rows, past the
  frame's bottom; Figma's list runs on past the frame too, and the frame
  has no layer for them: `group · RULES`,
  `toolkit row · commits-and-prs`, `toolkit row · diagrams`,
  `toolkit row · linear`, `toolkit row · readmes`,
  `toolkit row · releases`, `toolkit row · skills`,
  `toolkit row · ste100`, `toolkit row · writing`.
- **Kind chips.** The chip row runs past the list pane's edge and
  scrolls sideways (`hiddenOverflow` on `[data-figma="filter · chips"] >
  div.filter-chips__root`), so the Workflows chip's label and count
  (`Workflows`, `2`) are cut, as Figma cuts them after the chip's dot
  (459:179). `FilterChips fade="none"` (library 1.0.0-beta.65) draws the
  cut chip at full strength up to the pane's edge, as Figma does.
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
- **Rail Artifacts icon.** Figma draws `icon/artifacts` at 20 px (459:137)
  where the other rail icons are 22; the shared AppRail draws every item's
  icon at 24 (d-100), so the render's icon is 24 and `exceptions.json`
  names 459:137 (bridge-coord's shared decision, 2026-11-19).
- **Rail Toolkit icon.** Figma draws `icon/toolkit` at 20 px (459:142)
  where the other rail icons are 22; the shared AppRail draws every item's
  icon at 24 (d-100), so the render's icon is 24 and `exceptions.json`
  names 459:142, as for `icon/artifacts`.

## Second review

- **Row counts.** The two change counts in each list row sit level with
  the name, where Figma centres them in the row, as on D03 (gap: Toolkit
  row (pane)).
- **Rail items.** The rail items from Inbox to More sit 4 to 5 px higher
  under the logo than Figma's. The rail is the shared app frame; this is
  reported to bridge-coord for the cross-page audit.
