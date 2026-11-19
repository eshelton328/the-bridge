# D37 deviations

What still differs from Figma after the first check of the fidelity loop
(`pnpm fidelity toolkit D37 D03 D04 D07 D08 D09 D14`, 2026-11-17, against
the installed library 1.0.0-beta.20), each with its reason. The library
gaps are in `web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/ruleHowItWorks.ts`: D4's data with only the
Rules, Workflows and Hooks groups (as D9), and the rule skills open on its
How it works tab. D03, D04, D07, D08, D09 and D14 give the same results as
before D37 (each report's text, position and rule results are unchanged).
The frame's `exceptions.json` excepts the strings and the `hiddenOverflow`
findings below, each with the entry that records it; with them the text and
rules checks now pass. The Checks below are from a rerun with library
1.0.0-beta.25 and the item tabs' `tone` and `density` props (2026-11-17).

## Checks

- Text: fail. Every Figma string is in the render, no text is extra, and no
  text is covered by another element. Five strings are not visible:
  - `Workflows` and `2` (495:181, 495:182), the Workflows chip, which the
    chip row cuts at the list pane's edge, as Figma does (see Kind chips).
  - `commit-msg`, `hooks/commit-msg` and `→1 ←1` (495:311, 495:312,
    495:314): the taller list rows push the last row past the frame's
    bottom edge (see Row height).
- Position: 27 of 50 layers pass, among them the How it works header
  (`495:398`), the four legend items and the three use chips
  (`uses · link.sh`, `uses · paths:`, `uses · eval-cases`); and
  `toolkit list`, `read-only`, `filter · chips`, `search`,
  `group · RULES`, `toolkit item`, `meta row`, `kind badge`, both buttons,
  `495:334`, `path row` and `path badge`.
  The shared navigation's items pass too: `rail · Inbox`,
  `rail · Workspaces`, `rail · Projects`, `rail · Artifacts`,
  `rail · Toolkit` and `rail · More`.
- Rules: fail. Two `hiddenOverflow` findings: the list pane scrolls on its
  own (`[data-figma="toolkit list"]`), and the kind chips scroll sideways
  (`[data-figma="filter · chips"] > div.filter-chips__root`). D14 and D09
  have the same two; this frame's `exceptions.json` excepts them.

## Deviations

- **Step height.** The four step cards are 118 px high against Figma's
  148 (`steps` y +2 h -30; `step 1`, `step 2`, `step 3`, `step 4` each
  y +2 h -30). Figma's cards keep 148 with less in them; the render's
  cards are as tall as their content, and no size token has 148 (gap: How
  it works step height). So the rows under them sit higher:
  `chat path` y -28 and `source` y -31, and the How it works box is 30 px
  shorter (`how it works` y -2 h -30).
- **Trigger box.** The box that says when the rule loads is 38 px high
  against Figma's 31 (`trigger` y -3 h +7), on the pane fill with no green
  tint: `Panel variant="notice" tone="done"` pads 10/12 where Figma has
  7/11 (gap: How it works trigger).
- **In Codex box.** What Codex does instead is one line in a
  `Panel variant="notice"`, 38 px high against Figma's 35 (gap: How it
  works elsewhere box). Its height is within the tolerance; it is off only
  by the step height above (`chat path` y -28).
- **Step arrows.** The library has no line between steps (gap: How it
  works steps). Between the cards the render draws the 16 px
  `ArrowRightIcon` alone, where Figma draws a 38 px line with a head
  (`arrow` 495:518 to 495:520). The step number is a
  `Badge variant="outline"`, 22 px high against Figma's 19.
- **Use chips.** The chips' text is grey (`status.idle.fg`) where Figma
  colours it by what the step uses (`link.sh`, `paths:`, `eval-cases`);
  only the icon takes the colour (gap: How it works use chip). All three
  pass the position check.
- **Box spacing.** Figma pads the How it works box 18 at the sides and
  spaces its rows 14 apart; no space token has 18 or 14, so the render
  uses the Panel's padding with 4 and 2 more and rows 12 apart, 14 above
  the In Codex box and 8 under it (gap: How it works box spacing).
- **Header key.** Two Figma layers are named `header`: the list's
  (495:154) and the How it works header (495:398). The How it works
  header carries its node id, but the list pane's `ToolkitHeader` carries
  `header` in every frame, so the check finds `header` ambiguous, as in
  D14. Its name is right in D03, D04, D07, D08 and D09.
- **Item tabs.** `ItemTabs tone="accent"` (library #126, beta.21) draws
  the selected tab's label, How it works, cyan, as Figma's. The outline
  stays `border.selected` at half alpha where Figma's is solid cyan (no
  solid selected token, d-050). The desktop keeps the default density:
  12 px sides and 4 apart, as Figma's, and since library #153 (beta.42)
  each tab is within 1.1 px of Figma's width: the list's 2 px inset puts
  Overview at 526 against 524, and Activity ends at 988.3 against 989.
- **Row height.** Each list row is 62 px high against Figma's 53 (the
  open row is 62 against 55), and its counts sit level with the name,
  where Figma centres them. `ListRow` pads 10 inside a 1 px border (gap:
  Toolkit row (pane)). The first row starts 3 px lower and each row after
  it 9 px lower again: `toolkit row · commits-and-prs` y +3 h +9;
  `toolkit row · diagrams` y +12 h +9; `toolkit row · linear` y +21 h +9;
  `toolkit row · readmes` y +30 h +9; `toolkit row · releases` y +39
  h +9; `toolkit row · skills` y +48 h +7; `toolkit row · ste100` y +55
  h +9; `toolkit row · writing` y +64 h +9; `group · WORKFLOWS` y +73
  h +3; `toolkit row · skill-eval-cases` y +76 h +9;
  `toolkit row · skill-eval-round` y +85 h +9; `group · HOOKS` y +94
  h +3; `toolkit row · commit-msg` y +97 h +9. The list pane is taller
  than the frame and scrolls (`hiddenOverflow` on
  `[data-figma="toolkit list"]`), and the last row's text is below the
  frame's bottom edge. No page builds its own scroll layout (d-107).
- **Kind chips.** The chip row runs past the list pane's edge and
  scrolls sideways (`hiddenOverflow` on
  `[data-figma="filter · chips"] > div.filter-chips__root`), so the
  Workflows chip's label and count (`Workflows`, `2`) are cut, as Figma
  cuts them after the chip's dot (495:179).
- **All chip.** The render draws All as the selected chip, because the
  filter is All; Figma D37 draws no chip selected, as D4 does.
- **Buttons, copy button.** As in D4: Discuss and Show on map are both
  32 px high against Figma's 34 and 36 (gap: Item action buttons), and
  the copy icon is a plain button with `CopyIcon` (gap: Path badge copy
  button). Both pass the position check.
- **Other tabs.** Overview, Files, Links, Evals and Activity show no panel
  while How it works is selected; Files to Activity are later frames.
