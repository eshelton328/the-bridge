# D39 deviations

What still differs from Figma after the first check of the fidelity loop
(`pnpm fidelity toolkit D39 D03 D04 D07 D08 D09 D14 D37 D38`, 2026-11-17,
against the installed library 1.0.0-beta.20), each with its reason. The
library gaps are in `web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/hookHowItWorks.ts`: D9's data (D4's list with
only the Rules, Workflows and Hooks groups), with the hook commit-msg open
on its How it works tab. D03, D04, D07, D08, D09, D14, D37 and D38 give the
same results as before D39 (each report's text, position and rule results
are unchanged). The frame's `exceptions.json` excepts the strings and the
`hiddenOverflow` findings below, each with the entry that records it; with
them the text and rules checks now pass. The Checks below are from a rerun
with library 1.0.0-beta.25 and the item tabs' `tone` and `density` props
(2026-11-17).

## Checks

From `pnpm fidelity toolkit` on 2026-11-18, after the list rows moved to
`ListRow padding="pane"` and the pane's kind chips to `FilterChips
fade="none"` (library 1.0.0-beta.65), with the frame's
`exceptions.json`.

- Text: pass. `exceptions.json` excepts 2 Figma strings (`Workflows`,
  `2`); each is explained below.
- Position: 37 of 50 layers pass. The 13 that fail: `header`
  ambiguousLayer; `group · WORKFLOWS` y -5; `how it works` h -60;
  `trigger` h +7; `steps` h -60; `step 1` h -30; `step 2` h -30; `step
  3` h -30; `step 4` h -30; `step 5` y -28, h -30; `uses · git commit` y
  -29; `chat path` y -58; `source` y -61. Each is explained below.
- Rules: pass. 1 finding is excepted in `exceptions.json`:
  `hiddenOverflow` on `[data-figma="filter · chips"] >
  div.filter-chips__root`.

## Deviations

- **Step height.** The five step cards are 118 px high against Figma's
  148 (`step 1`, `step 2`, `step 3`, `step 4` each y +2 h -30). Figma's
  cards keep 148 with less in them; the render's cards are as tall as
  their content, and no size token has 148 (gap: How it works step
  height). So each row is 30 px shorter: `step 5` y -28 h -30 and its chip
  `uses · git commit` y -29; the steps are 60 px shorter (`steps` y +2
  h -60), the rows under them sit higher (`chat path` y -58, `source`
  y -61), and the How it works box is 60 px shorter (`how it works` y -2
  h -60).
- **Elbow to step 5.** Figma joins step 4 to step 5 with a line that runs
  down from step 4, back along the row and down into step 5 (`arrow`
  495:1700, 714 × 46). The library has no line between steps (gap: How it
  works steps), so the render draws only the 16 px `ArrowDownIcon` under
  step 1, over step 5. Between the cards of the first row the render draws
  the 16 px `ArrowRightIcon` alone, where Figma draws a 38 px line with a
  head (`arrow` 495:1694 to 495:1696). The step number is a
  `Badge variant="outline"`, 22 px high against Figma's 19.
- **Trigger box.** The box that says when the hook runs is 38 px high
  against Figma's 31 (`trigger` y -3 h +7), on the pane fill with no green
  tint: `Panel variant="notice" tone="done"` pads 10/12 where Figma has
  7/11 (gap: How it works trigger).
- **Tests box.** The tests line (TESTS) is one line in a
  `Panel variant="notice"`, 38 px high against Figma's 35, as D37's In
  Codex line (gap: How it works elsewhere box). Its height is within the
  tolerance; it is off only by the step height above (`chat path` y -58).
- **Use chips.** The chips' text is grey (`status.idle.fg`) where Figma
  colours it in the kind's colour (`commits-and-prs` amber, `git commit`
  cyan); only the icon takes the colour (gap: How it works use chip).
- **Box spacing.** Figma pads the How it works box 18 at the sides and
  spaces its rows 14 apart; no space token has 18 or 14, so the render
  uses the Panel's padding with 4 and 2 more and rows 12 apart (gap: How
  it works box spacing).
- **Header key.** Two Figma layers are named `header`: the list's
  (495:1263) and the How it works header (495:1574). The How it works
  header carries its node id, but the list pane's `ToolkitHeader` carries
  `header` in every frame, so the check finds `header` ambiguous, as in
  D14, D37 and D38.
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
  tolerance: `group · WORKFLOWS` y -5. With the shorter rows the last
  rows' text (`hooks/commit-msg`, `→1 ←1`, `commit-msg`) lies above the
  frame's foot and is visible, so its exceptions are gone. The list no
  longer runs past the frame's foot, so the pane does not scroll on its
  own and its `hiddenOverflow` exception on `[data-figma="toolkit
  list"]` is gone.
- **Kind chips.** The chip row runs past the list pane's edge and
  scrolls sideways (`hiddenOverflow` on `[data-figma="filter · chips"] >
  div.filter-chips__root`), so the Workflows chip's label and count
  (`Workflows`, `2`) are cut, as Figma cuts them after the chip's dot
  (495:1288). `FilterChips fade="none"` (library 1.0.0-beta.65) draws
  the cut chip at full strength up to the pane's edge, as Figma does.
- **All chip.** The render draws All as the selected chip, because the
  filter is All; Figma D39 draws no chip selected, as D9 does.
- **Rail.** The rail's items sit 4 to 5 px higher than Figma's, a known
  difference of the shared app frame (`AppRail`); this frame does not
  change the app frame or the navigation.
- **Buttons, copy button.** As in D9: Discuss and Show on map are both
  32 px high against Figma's 34 and 36 (gap: Item action buttons), and
  the copy icon is a plain button with `CopyIcon` (gap: Path badge copy
  button). Both pass the position check.
- **Other tabs.** Overview, Files, Links, Evals and Activity show no panel
  while How it works is selected; Files to Activity are later frames.
