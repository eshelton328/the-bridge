# D38 deviations

What still differs from Figma after the first check of the fidelity loop
(`pnpm fidelity toolkit D38 D03 D04 D07 D08 D09 D14 D37`, 2026-11-17,
against the installed library 1.0.0-beta.20), each with its reason. The
library gaps are in `web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/agentHowItWorks.ts`: D7's data (T1's list with
only the Skills and Agents groups, Skills closed), with the agent
writing-reviewer open on its How it works tab. D03, D04, D07, D08, D09, D14
and D37 give the same results as before D38 (each report's text, position
and rule results are unchanged). The frame's `exceptions.json` excepts the
strings and the `hiddenOverflow` finding below, each with the entry that
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
- Position: 32 of 44 layers pass. The 12 that fail: `header`
  ambiguousLayer; `toolkit row · diagram-reviewer` y +6; `toolkit row ·
  eval-case-writer` y +5; `how it works` h -30; `trigger` h +7; `steps`
  h -30; `step 1` h -30; `step 2` h -30; `step 3` h -30; `step 4` h -30;
  `chat path` y -28; `source` y -31. Each is explained below.
- Rules: pass. 1 finding is excepted in `exceptions.json`:
  `hiddenOverflow` on `[data-figma="filter · chips"] >
  div.filter-chips__root`.

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
  tolerance: `toolkit row · diagram-reviewer` y +6; `toolkit row ·
  eval-case-writer` y +5.
- **Kind chips.** The chip row runs past the list pane's edge and
  scrolls sideways (`hiddenOverflow` on `[data-figma="filter · chips"] >
  div.filter-chips__root`), so the Workflows chip's label and count
  (`Workflows`, `2`) are cut, as Figma cuts them after the chip's dot
  (495:738). `FilterChips fade="none"` (library 1.0.0-beta.65) draws the
  cut chip at full strength up to the pane's edge, as Figma does.
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
- **Rail Artifacts icon.** Figma draws `icon/artifacts` at 20 px (495:696)
  where the other rail icons are 22; the shared AppRail draws every item's
  icon at 24 (d-100), so the render's icon is 24 and `exceptions.json`
  names 495:696 (bridge-coord's shared decision, 2026-11-19).
- **Rail Toolkit icon.** Figma draws `icon/toolkit` at 20 px (495:701)
  where the other rail icons are 22; the shared AppRail draws every item's
  icon at 24 (d-100), so the render's icon is 24 and `exceptions.json`
  names 495:701, as for `icon/artifacts`.

## Notifications switch (d-118)

In the app, the rail has a Notifications switch at its end, which this
frame does not draw. Erik asked on 2026-11-21: "Can we get lush
notifications on the phone for this app?" ("lush" is a typo for "push"),
and decision d-118 adds Web Push with this switch to turn it on. It is a
frame exception that the app owns (`web/src/blocks/AppRail.tsx`,
`web/src/blocks/NotificationsSwitch.tsx`). The screen draws the switch
only when the page entry passes `push`; this frame's state and story pass
none, so the checks above are unchanged.
