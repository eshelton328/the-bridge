# D25 deviations

What still differs from Figma after the fidelity loop
(`pnpm fidelity toolkit D25`, 2026-11-18, against library 1.0.0-beta.36:
a first run and three fix rounds), each with its reason. The library
gaps are in `web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/ruleEvals.ts`: D37's data (D4's list with
D9's groups), with the rule skills open on its Evals tab and D4's skills
in `evalTargets` for the ledgers. Every other Toolkit frame (D03, D04,
D06 to D10, D13, D14, D19 and D29 to D39 and the list frames) gives the
same text, position and rule results as before the Evals tab. The
frame's `exceptions.json` excepts the strings and the `hiddenOverflow`
findings below, each with the entry that records it; with them the text
and rules checks now pass.

## Checks

From `pnpm fidelity toolkit` on 2026-11-18, after the list rows moved to
`ListRow padding="pane"` and the pane's kind chips to `FilterChips
fade="none"` (library 1.0.0-beta.65), with the frame's
`exceptions.json`.

- Text: pass. `exceptions.json` excepts 2 Figma strings (`Workflows`,
  `2`); each is explained below.
- Position: 35 of 40 layers pass. The 5 that fail: `toolkit row ·
  ste100` y -5; `toolkit row · writing` y -6; `group · WORKFLOWS` y -7;
  `toolkit row · skill-eval-round` y -5; `group · HOOKS` y -6. Each is
  explained below.
- Rules: pass. 1 finding is excepted in `exceptions.json`:
  `hiddenOverflow` on `[data-figma="filter · chips"] >
  div.filter-chips__root`.

## Deviations

- **Row height.** Each list row is 52 px high against Figma's 53, and
  the open item's row 52 against its 55 (`ListRow padding="pane"`,
  library 1.0.0-beta.65); 53 and 55 are off the 4 px grid (d-100), so 52
  is the decision. The kind tile, the name over the path and the counts
  sit centred down the row, as in Figma; the tile is 11 px in against
  Figma's 10, since 10 needs a 9 px padding that no space token has
  (gap: Toolkit row (pane)). Each row starts higher than Figma's by 1 px
  for each row above it and 3 px after the open item's row, and the
  group headers are 3 px taller than Figma's 27. The keys past the
  tolerance: `toolkit row · ste100` y -5; `toolkit row · writing` y -6;
  `group · WORKFLOWS` y -7; `toolkit row · skill-eval-round` y -5;
  `group · HOOKS` y -6. With the shorter rows the last rows' text
  (`commit-msg`, `hooks/commit-msg`, `→1 ←1`) lies above the frame's
  foot and is visible, so its exceptions are gone. The list no longer
  runs past the frame's foot, so the pane does not scroll on its own and
  its `hiddenOverflow` exception on `[data-figma="toolkit list"]` is
  gone.
- **List pane.** The kind chips are wider than the list pane and scroll
  sideways (`[data-figma="filter · chips"] > div.filter-chips__root`);
  Figma cuts the Workflows chip at the same edge, so `Workflows` and `2`
  are not visible in either. `FilterChips fade="none"` (library
  1.0.0-beta.65) draws the cut chip at full strength up to the pane's
  edge, as Figma does; before, it faded out over 24 px.
- **Ledger rows.** Each ledger's name (writer, ambitious, agents-md,
  readme) is a plain button in the label style that opens the skill:
  writer on its Evals tab (D20), the others on their Overview. The
  library has no round row and no text link at this size, so the rows
  are styled with tokens (gap: Evals panels). The count 4 ledgers is
  accent text with no tap.
- **Item tabs.** Since library #153 (beta.42) only the selected tab has
  a border, so each tab is within 1.1 px of Figma's width and starts
  within 2 px of its x: Overview starts at 526 against Figma's 524 (the
  list pads 2 px in the default density), and Activity ends at 988.3
  against 989. The selected tab, Evals, is 60.9 × 32 against Figma's
  61 × 34, 2 px lower (y 180 against 178), since `ItemTabs`' selected
  tab is as high as the others (32) and no size token is 34 (gap: Item
  tab width).
- **Rail Artifacts icon.** Figma draws `icon/artifacts` at 20 px (492:137)
  where the other rail icons are 22; the shared AppRail draws every item's
  icon at 24 (d-100), so the render's icon is 24 and `exceptions.json`
  names 492:137 (bridge-coord's shared decision, 2026-11-19).
- **Rail Toolkit icon.** Figma draws `icon/toolkit` at 20 px (492:142)
  where the other rail icons are 22; the shared AppRail draws every item's
  icon at 24 (d-100), so the render's icon is 24 and `exceptions.json`
  names 492:142, as for `icon/artifacts`.

## Settings gear (d-119)

In the app, the rail has a Settings gear before More, which this frame
does not draw: Settings has no Figma page, and decision d-119 puts its
entry in the rail (`web/src/blocks/AppRail.tsx`). The Notifications
switch that d-118 put at the rail's end moved to the Settings page, so
the rail no longer draws it. The screen draws the gear only when the
page entry passes `settingsEntry`; this frame's state and story pass
none, so the checks above are unchanged.
