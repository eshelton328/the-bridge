# D38 deviations

What still differs from Figma after the first check of the fidelity loop
(`pnpm fidelity toolkit D38 D03 D04 D07 D08 D09 D14 D37`, 2026-11-17,
against the installed library 1.0.0-beta.20), each with its reason. The
library gaps are in `web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/agentHowItWorks.ts`: D7's data (T1's list with
only the Skills and Agents groups, Skills closed), with the agent
writing-reviewer open on its How it works tab. D03, D04, D07, D08, D09, D14
and D37 give the same results as before D38 (each report's text, position
and rule results are unchanged). The frame has no `exceptions.json`. The
Checks below are from a rerun with library 1.0.0-beta.25 and the item
tabs' `tone` and `density` props (2026-11-17).

## Checks

- Text: fail. Every Figma string is in the render, no text is extra, and no
  text is covered by another element. Two strings are not visible:
  `Workflows` and `2` (495:740, 495:741), the Workflows chip, which the
  chip row cuts at the list pane's edge, as Figma does (see Kind chips).
- Position: 28 of 44 layers pass, among them the How it works header
  (`495:948`), the title (`495:846`), the four legend items and the three
  use chips (`uses · writer/scripts/check`, `uses · references/<form>.md`,
  `uses · ls, grep, git ls-files`); and `toolkit list`, `read-only`,
  `filter · chips`, `search`, `group · SKILLS`, `group · AGENTS`,
  `toolkit item`, `meta row`, `kind badge`, both buttons, `path row` and
  `path badge`.
  The shared navigation's items pass too: `rail · Inbox`,
  `rail · Workspaces`, `rail · Projects`, `rail · Artifacts`,
  `rail · Toolkit` and `rail · More`.
- Rules: fail. One `hiddenOverflow` finding: the kind chips scroll
  sideways (`[data-figma="filter · chips"] > div.filter-chips__root`), as
  in D37. This frame takes no exceptions.

## Deviations

- **Step height.** The four step cards are 118 px high against Figma's
  148 (`steps` y +2 h -30; `step 1`, `step 2`, `step 3`, `step 4` each
  y +2 h -30). Figma's cards keep 148 with less in them; the render's
  cards are as tall as their content, and no size token has 148 (gap: How
  it works step height). So the rows under them sit higher:
  `chat path` y -28 and `source` y -31, and the How it works box is 30 px
  shorter (`how it works` y -2 h -30).
- **Trigger box.** The box that says when the agent starts is 38 px high
  against Figma's 31 (`trigger` y -3 h +7), on the pane fill with no green
  tint: `Panel variant="notice" tone="done"` pads 10/12 where Figma has
  7/11 (gap: How it works trigger).
- **Inputs box.** The only inputs the agent gets (IT GETS ONLY) are one
  line in a `Panel variant="notice"`, 38 px high against Figma's 35, as
  D37's In Codex line (gap: How it works elsewhere box). Its height is
  within the tolerance; it is off only by the step height above
  (`chat path` y -28).
- **Step arrows.** The library has no line between steps (gap: How it
  works steps). Between the cards the render draws the 16 px
  `ArrowRightIcon` alone, where Figma draws a 38 px line with a head
  (`arrow` 495:1068 to 495:1070). The step number is a
  `Badge variant="outline"`, 22 px high against Figma's 19.
- **Use chips.** The chips' text is grey (`status.idle.fg`) where Figma
  colours it amber (`writer/scripts/check`, `references/<form>.md`,
  `ls, grep, git ls-files`); only the icon takes the colour (gap: How it
  works use chip). All three pass the position check.
- **Box spacing.** Figma pads the How it works box 18 at the sides and
  spaces its rows 14 apart; no space token has 18 or 14, so the render
  uses the Panel's padding with 4 and 2 more and rows 12 apart (gap: How
  it works box spacing).
- **Header key.** Two Figma layers are named `header`: the list's
  (495:713) and the How it works header (495:948). The How it works
  header carries its node id, but the list pane's `ToolkitHeader` carries
  `header` in every frame, so the check finds `header` ambiguous, as in
  D14 and D37.
- **Item tabs.** `ItemTabs tone="accent"` (library #126, beta.21) draws
  the selected tab's label, How it works, cyan, as Figma's. The outline
  stays `border.selected` at half alpha where Figma's is solid cyan (no
  solid selected token, d-050). The desktop keeps the default density:
  12 px sides and 4 apart, as Figma's, but the list's 2 px inset and the
  slightly wider labels put Activity about 8 px further right.
- **Row height.** Each list row is 62 px high against Figma's 53 (the
  open row is 62 against 55), and its counts sit level with the name,
  where Figma centres them. `ListRow` pads 10 inside a 1 px border (gap:
  Toolkit row (pane)). The first row starts 6 px lower and each row after
  it 9 px lower again: `toolkit row · diagram-reviewer` y +6 h +9;
  `toolkit row · eval-case-writer` y +15 h +9;
  `toolkit row · eval-grader` y +24 h +9;
  `toolkit row · pr-description-checker` y +33 h +9;
  `toolkit row · readme-cold-reader` y +42 h +9;
  `toolkit row · writing-reviewer` y +60 h +7. The rows still fit in the
  frame, as in D07.
- **Kind chips.** The chip row runs past the list pane's edge and
  scrolls sideways (`hiddenOverflow` on
  `[data-figma="filter · chips"] > div.filter-chips__root`), so the
  Workflows chip's label and count (`Workflows`, `2`) are cut, as Figma
  cuts them after the chip's dot (495:738).
- **All chip.** The render draws All as the selected chip, because the
  filter is All; Figma D38 draws no chip selected, as D7 does.
- **Rail.** The rail's items sit 4 to 5 px higher than Figma's, a known
  difference of the shared app frame (`AppRail`); this frame does not
  change the app frame or the navigation.
- **Buttons, copy button.** As in D7: Discuss and Show on map are both
  32 px high against Figma's 34 and 36 (gap: Item action buttons), and
  the copy icon is a plain button with `CopyIcon` (gap: Path badge copy
  button). Both pass the position check.
- **Other tabs.** Overview, Files, Links, Evals and Activity show no panel
  while How it works is selected; Files to Activity are later frames.
