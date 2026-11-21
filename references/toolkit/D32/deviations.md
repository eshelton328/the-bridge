# D32 deviations

What still differs from Figma after the first run of the fidelity loop
(`pnpm fidelity toolkit D32 D31 D30 D29 D19 D03 D06 D07 D08 D09 D10 D13 D14 D33`,
2026-11-18, against the installed library 1.0.0-beta.31), each with its
reason. The library gaps are in `web/src/pages/toolkit/LIBRARY_GAPS.md`.
The state is `web/src/pages/toolkit/states/hookLinks.ts`: D9's data (the
Rules, Workflows and Hooks groups), with the hook commit-msg open on its
Links tab. D31, D30, D29, D19, D03, D06, D07, D08, D09, D10, D13, D14 and
D33 give the same results as before D32 (each report's text, position and
rule results are unchanged). The frame's `exceptions.json` excepts the
strings and the `hiddenOverflow` findings below, each with the entry that
records it; with them the text and rules checks now pass.

The last fidelity run (`pnpm fidelity toolkit`, every Toolkit frame,
2026-11-18) used the installed library 1.0.0-beta.42, with the graph's
open item 150 × 40 at Figma's place and, on the phone, the open item's
lines drawn upright and the open item selected. Text fails, 28 of 41
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
- Position: 40 of 41 layers pass. The 1 that fail: `group · WORKFLOWS` y
  -5. Each is explained below.
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
  tolerance: `group · WORKFLOWS` y -5. With the shorter rows the last
  rows' text (`hooks/commit-msg`, `→1 ←1`, `commit-msg`) lies above the
  frame's foot and is visible, so its exceptions are gone. The list no
  longer runs past the frame's foot, so the pane does not scroll on its
  own and its `hiddenOverflow` exception on `[data-figma="toolkit
  list"]` is gone.
- **Kind chips.** The chip row is wider than the list pane and scrolls
  sideways; Figma cuts the Workflows chip at the same edge, so
  `Workflows` and `2` are not visible in either. `FilterChips
  fade="none"` (library 1.0.0-beta.65) draws the cut chip at full
  strength up to the pane's edge, as Figma does.
- **Graph's open item.** commit-msg in the middle of the graph is
  150 × 40 with its name in the label style, at Figma's place, as
  Figma's (library beta.39 node `size` and `labelStyle: 'label'`, #151).
  Its icon is 16 px against Figma's 15 and sits 8 from the name against
  Figma's 6: `MapNode` takes no icon size or gap (gap: Links graph).
- **Node borders.** Since library beta.39 (#151) each item at a side of
  the graph has its kind's colour at 60 % alpha (`MapGraph
  nodeTone="muted"`, `kindBorder.*`) and each link row's node at 45 %
  (`MapNode tone="faint"`, `kindBorderFaint.*`), with the icons in the
  full kind colour, as in Figma. The icons are 16 px against Figma's 13:
  `MapNode` takes no icon size (gap: Links graph, Links panel rows).
- **Link nodes.** commits-and-prs at the start of each link row is a
  `MapNode` 28 px high against Figma's 29 and a few px wider, and the file
  and line at the row's end is a plain mono button in the accent colour
  (gap: Links panel rows). Both rows pass the position check.
- **Buttons.** Discuss and Show on map are both 32 px high, against
  Figma's 34 and 36, as on D9 (gap: Item action buttons). Both pass the
  position check.
- **Copy button.** The path badge's copy icon is a plain button with the
  library's `CopyIcon`, as on D9 (gap: Path badge copy button).
- **Rail Artifacts icon.** Figma draws `icon/artifacts` at 20 px
  (493:2597) where the other rail icons are 22; the shared AppRail draws
  every item's icon at 24 (d-100), so the render's icon is 24 and
  `exceptions.json` names 493:2597 (bridge-coord's shared decision,
  2026-11-19).
- **Rail Toolkit icon.** Figma draws `icon/toolkit` at 20 px (493:2602)
  where the other rail icons are 22; the shared AppRail draws every item's
  icon at 24 (d-100), so the render's icon is 24 and `exceptions.json`
  names 493:2602, as for `icon/artifacts`.
- **Link row icons.** Figma draws each link row's kind icon in the Links
  panel at 13 px; `MapNode iconSize="12"` (library #265) draws it at 12,
  within the icon check's 2 px.

## Notifications switch (d-118)

In the app, the rail has a Notifications switch at its end, which this
frame does not draw. Erik asked on 2026-11-21: "Can we get lush
notifications on the phone for this app?" ("lush" is a typo for "push"),
and decision d-118 adds Web Push with this switch to turn it on. It is a
frame exception that the app owns (`web/src/blocks/AppRail.tsx`,
`web/src/blocks/NotificationsSwitch.tsx`). The screen draws the switch
only when the page entry passes `push`; this frame's state and story pass
none, so the checks above are unchanged.
