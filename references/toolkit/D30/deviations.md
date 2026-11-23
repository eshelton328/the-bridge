# D30 deviations

What still differs from Figma after the first run of the fidelity loop
(`pnpm fidelity toolkit D30 D29 D19 D03 D06 D07 D08 D09 D10 D13 D14 D33`,
2026-11-18, against the installed library 1.0.0-beta.31), each with its
reason. The library gaps are in `web/src/pages/toolkit/LIBRARY_GAPS.md`.
The state is `web/src/pages/toolkit/states/agentLinks.ts`: D7's data (the
Skills and Agents groups, Skills closed), with the agent writing-reviewer
open on its Links tab. D29, D19, D03, D06, D07, D08, D09, D10, D13, D14 and
D33 give the same results as before D30 (each report's text, position and
rule results are unchanged). The frame's `exceptions.json` excepts the
strings and the `hiddenOverflow` finding below, each with the entry that
records it; with them the text and rules checks now pass.

The last fidelity run (`pnpm fidelity toolkit`, every Toolkit frame,
2026-11-18) used the installed library 1.0.0-beta.42, with the graph's
open item 150 × 40 at Figma's place and, on the phone, the open item's
lines drawn upright and the open item selected. Text fails, 34 of 40
position layers pass and the rules fail. Against the same run on main
(24fc7be), the position and rule results, failing keys and findings are
the same.

## Checks

From `pnpm fidelity toolkit` on 2026-11-18, after the list rows moved to
`ListRow padding="pane"` and the pane's kind chips to `FilterChips
fade="none"` (library 1.0.0-beta.65), with the frame's
`exceptions.json`.

- Text: pass. `exceptions.json` excepts 2 Figma strings (`Workflows`,
  `2`); each is explained below.
- Position: 38 of 40 layers pass. The 2 that fail: `toolkit row ·
  diagram-reviewer` y +6; `toolkit row · eval-case-writer` y +5. Each is
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
  tolerance: `toolkit row · diagram-reviewer` y +6; `toolkit row ·
  eval-case-writer` y +5.
- **Kind chips.** The chip row is wider than the list pane and scrolls
  sideways; Figma cuts the Workflows chip at the same edge, so
  `Workflows` and `2` are not visible in either. `FilterChips
  fade="none"` (library 1.0.0-beta.65) draws the cut chip at full
  strength up to the pane's edge, as Figma does.
- **Graph's open item.** writing-reviewer in the middle of the graph has
  its name in the label style, centred where Figma centres its 150 × 40
  node, as Figma's (library beta.39 node `size` and `labelStyle:
  'label'`, #151). Its icon is 16 px against Figma's 15 and sits 8 from
  the name against Figma's 6: `MapNode` takes no icon size or gap (gap:
  Links graph). The name would not fit at Figma's 150 px: Figma's
  `writing-reviewer` is 108 px wide (493:1502), and the library's label
  style leaves a name 104 px of the 150 (a 1 px border and 10 px padding
  at each side, the 16 px icon and the 8 px gap, where Figma's 15 px
  icon and 6 px gap leave 108). The graph measures the name after render
  and once the fonts load and, as it is cut, draws writing-reviewer
  180 × 40, as wide as the side items, centred on the same point
  (`widenFocus`), so the whole name shows (gap: Links graph).
- **Node borders.** Since library beta.39 (#151) each item at a side of
  the graph has its kind's colour at 60 % alpha (`MapGraph
  nodeTone="muted"`, `kindBorder.*`) and each link row's node at 45 %
  (`MapNode tone="faint"`, `kindBorderFaint.*`), with the icons in the
  full kind colour, as in Figma. The icons are 16 px against Figma's 13:
  `MapNode` takes no icon size (gap: Links graph, Links panel rows).
- **Link nodes.** The item at the start of each link row is a `MapNode`
  28 px high against Figma's 29 and a few px wider, and the file and line
  at the row's end is a plain mono button in the accent colour (gap: Links
  panel rows). Every row passes the position check.
- **Buttons.** Discuss and Show on map are both 32 px high, against
  Figma's 34 and 36, as on D7 (gap: Item action buttons). Both pass the
  position check.
- **Copy button.** The path badge's copy icon is a plain button with the
  library's `CopyIcon`, as on D7 (gap: Path badge copy button).
- **Rail Artifacts icon.** Figma draws `icon/artifacts` at 20 px
  (493:1051) where the other rail icons are 22; the shared AppRail draws
  every item's icon at 24 (d-100), so the render's icon is 24 and
  `exceptions.json` names 493:1051 (bridge-coord's shared decision,
  2026-11-19).
- **Rail Toolkit icon.** Figma draws `icon/toolkit` at 20 px (493:1056)
  where the other rail icons are 22; the shared AppRail draws every item's
  icon at 24 (d-100), so the render's icon is 24 and `exceptions.json`
  names 493:1056, as for `icon/artifacts`.
- **Link row icons.** Figma draws each link row's kind icon in the Links
  panel at 13 px; `MapNode iconSize="12"` (library #265) draws it at 12,
  within the icon check's 2 px.

## Settings gear (d-119)

In the app, the rail has a Settings gear before More, which this frame
does not draw: Settings has no Figma page, and decision d-119 puts its
entry in the rail (`web/src/blocks/AppRail.tsx`). The Notifications
switch that d-118 put at the rail's end moved to the Settings page, so
the rail no longer draws it.
