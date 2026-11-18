# D39 deviations

What still differs from Figma after the first check of the fidelity loop
(`pnpm fidelity toolkit D39 D03 D04 D07 D08 D09 D14 D37 D38`, 2026-11-17,
against the installed library 1.0.0-beta.20), each with its reason. The
library gaps are in `web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/hookHowItWorks.ts`: D9's data (D4's list with
only the Rules, Workflows and Hooks groups), with the hook commit-msg open
on its How it works tab. D03, D04, D07, D08, D09, D14, D37 and D38 give the
same results as before D39 (each report's text, position and rule results
are unchanged). The frame has no `exceptions.json`.

## Checks

- Text: fail. Every Figma string is in the render, no text is extra, and no
  text is covered by another element. Five strings are not visible:
  `Workflows` and `2` (495:1290, 495:1291), the Workflows chip, which the
  chip row cuts at the list pane's edge, as Figma does (see Kind chips);
  and `hooks/commit-msg`, `→1 ←1` and `commit-msg` (495:1421, 495:1423,
  and the second `commit-msg` the frame needs, the hook's list row
  495:1420; the check names 495:1443). These three are the open hook's
  list row, which the render draws below the frame's bottom edge (see Row
  height), as in D09.
- Position: 25 of 50 layers pass, among them the title (`495:1443`), the
  How it works header (`495:1574`), the four legend items and the
  `uses · commits-and-prs` chip; and `toolkit list`, `read-only`,
  `filter · chips`, `search`, `group · RULES`, `toolkit item`, `meta row`,
  `kind badge`, both buttons, `path row` and `path badge`.
  The shared navigation's items pass too: `rail · Inbox`,
  `rail · Workspaces`, `rail · Projects`, `rail · Artifacts`,
  `rail · Toolkit` and `rail · More`.
- Rules: fail. Two `hiddenOverflow` findings: the list pane
  (`[data-figma="toolkit list"]`) is 1066 px high in a 982 px frame and
  scrolls, because of the taller rows (see Row height), as in D09; and the
  kind chips scroll sideways
  (`[data-figma="filter · chips"] > div.filter-chips__root`), as in D37
  and D38. This frame takes no exceptions.

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
- **Item tabs.** The selected tab, How it works, is white with a grey
  outline where Figma's is cyan, and the tabs are spaced wider, so
  Activity starts further right (gaps: Item tab selected tone, Item tab
  spacing).
- **Row height.** Each list row is 62 px high against Figma's 53 (the
  open row is 62 against 55), and its counts sit level with the name,
  where Figma centres them. `ListRow` pads 10 inside a 1 px border (gap:
  Toolkit row (pane)). The first row starts 3 px lower and each row after
  it 9 px lower again: `toolkit row · commits-and-prs` y +3 h +9;
  `toolkit row · diagrams` y +12 h +9; `toolkit row · linear` y +21 h +9;
  `toolkit row · readmes` y +30 h +9; `toolkit row · releases` y +39 h +9;
  `toolkit row · skills` y +48 h +9; `toolkit row · ste100` y +57 h +9;
  `toolkit row · writing` y +66 h +9; `group · WORKFLOWS` y +75;
  `toolkit row · skill-eval-cases` y +78 h +9;
  `toolkit row · skill-eval-round` y +87 h +9; `group · HOOKS` y +96;
  `toolkit row · commit-msg` y +99 h +7. The open hook's row falls below
  the frame's foot, so the list scrolls (`hiddenOverflow` on
  `[data-figma="toolkit list"]`), as in D09.
- **Kind chips.** The chip row runs past the list pane's edge and
  scrolls sideways (`hiddenOverflow` on
  `[data-figma="filter · chips"] > div.filter-chips__root`), so the
  Workflows chip's label and count (`Workflows`, `2`) are cut, as Figma
  cuts them after the chip's dot (495:1288).
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
