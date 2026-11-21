# D20 deviations

What still differs from Figma after the fidelity loop
(`pnpm fidelity toolkit D20`, 2026-11-18, against library 1.0.0-beta.36:
a first run and three fix rounds), each with its reason. The library
gaps are in `web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/skillEvals.ts`: D3's data (the list has
T1's data), with writer open on its Evals tab. Every other Toolkit frame
(D03, D04, D06 to D10, D13, D14, D19 and D29 to D39 and the list frames)
gives the same text, position and rule results as before the Evals tab.
The frame's `exceptions.json` excepts the strings and the
`hiddenOverflow` findings below, each with the entry that records it;
with them the text and rules checks now pass.

## Checks

From `pnpm fidelity toolkit` on 2026-11-18, after the list rows moved to
`ListRow padding="pane"` and the pane's kind chips to `FilterChips
fade="none"` (library 1.0.0-beta.65), with the frame's
`exceptions.json`.

- Text: pass. `exceptions.json` excepts 2 Figma strings (`Workflows`,
  `2`); each is explained below.
- Position: 47 of 66 layers pass. The 19 that fail: `group · AGENTS` y
  -8; `toolkit row · diagram-reviewer` y -5; `toolkit row ·
  eval-case-writer` y -6; `toolkit row · eval-grader` y -7; `toolkit row
  · pr-description-checker` y -8; `toolkit row · readme-cold-reader` y
  -9; `toolkit row · writing-reviewer` y -11; `group · RULES` noLayer;
  `toolkit row · commits-and-prs` noLayer; `toolkit row · diagrams`
  noLayer; `toolkit row · linear` noLayer; `toolkit row · readmes`
  noLayer; `toolkit row · releases` noLayer; `toolkit row · skills`
  noLayer; `toolkit row · ste100` noLayer; `toolkit row · writing`
  noLayer; `evals` h -5; `badge · D6` w -7.6; `chart` h +25. Each is
  explained below.
- Rules: pass. 2 findings are excepted in `exceptions.json`:
  `hiddenOverflow` on `[data-figma="toolkit list"]`; `hiddenOverflow` on
  `[data-figma="filter · chips"] > div.filter-chips__root`.

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
  tolerance: `group · AGENTS` y -8; `toolkit row · diagram-reviewer` y
  -5; `toolkit row · eval-case-writer` y -6; `toolkit row · eval-grader`
  y -7; `toolkit row · pr-description-checker` y -8; `toolkit row ·
  readme-cold-reader` y -9; `toolkit row · writing-reviewer` y -11. With
  the shorter rows the last rows' text (`agents/eval-case-writer.md`,
  `eval-grader`, `agents/eval-grader.md`, `→0 ←2`) lies above the
  frame's foot and is visible, so its exceptions are gone.
- **Rules group.** The list has T1's data, so the Rules group lies below
  the frame: `group · RULES`, `toolkit row · commits-and-prs`,
  `toolkit row · diagrams`, `toolkit row · linear`,
  `toolkit row · readmes`, `toolkit row · releases`,
  `toolkit row · skills`, `toolkit row · ste100`,
  `toolkit row · writing` have no layer in the frame (`noLayer`), as on
  D19.
- **List pane.** The kind chips are wider than the list pane and scroll
  sideways (`[data-figma="filter · chips"] > div.filter-chips__root`);
  Figma cuts the Workflows chip at the same edge, so `Workflows` and `2`
  are not visible in either. `FilterChips fade="none"` (library
  1.0.0-beta.65) draws the cut chip at full strength up to the pane's
  edge, as Figma does; before, it faded out over 24 px. The list pane
  scrolls on its own (`[data-figma="toolkit list"]`): its rows run on
  past the frame's foot, as Figma's list does.
- **Line heights.** The tab's headers, its small and mono lines and its
  rows are 16 px high in the `monoCaps`, `small` and `mono` text styles
  against Figma's 17: the library keeps line heights on the 4 px grid
  (d-072). The rows sit 8 and 10 apart in turn to keep Figma's 25 and 47
  px steps on average, and the lines under the badges, the chart and the
  cases 2 px lower, so most rows stay within the tolerance; what remains
  adds up down the tab: `evals` h -5 (gap: Evals panels).
- **Chart size.** The chart's box is 392 × 135 against Figma's 392 × 110
  (`chart` y -2 h +25): `GroupedBarChart` draws its axis inside its own
  SVG, where Figma's `chart` layer is the plot and `axis` (482:1947) a
  row under it. The bars, their 56 px pitch and the axis labels sit
  where Figma's do (gap: Evals bar chart).
- **Badges.** The criteria are the library's `Badge size="sm"`, each 2
  px wider than Figma's, so they sit 4 apart against Figma's 6 and each
  stays at Figma's x. The checks and the cross are the library's 12 px
  `CheckIcon` and `CloseCircleIcon` against Figma's 11, and thinner:
  their stroke is 1 px at 12 px, where Figma's is about 2 px at 11, so
  Figma's cross reads as a filled red circle and the render's as a ring.
  No icon takes a weight or has a bold build. The waiting
  criterion D6 Real use · waits has its label in the badge's one style,
  112 × 20, where Figma draws it in a larger style, 120 × 21
  (`badge · D6` x +1 y -1 w -7.6 h -1; gap: Evals criterion badge).
- **Open the ledger.** Figma draws Open the ledger in the accent colour.
  The ledger is in projects/skill-evals/, outside the toolkit, and no
  frame draws it, so the render keeps the link disabled, in the accent colour at the
  disabled opacity, with
  a title that says so (gap: Evals panels).
- **D5 Reviewer.** The badge opens the agent writing-reviewer on its
  Evals tab (D26; T25 on a tablet). `Badge` takes no press, so it sits
  in a plain button styled with tokens, which draws nothing of its own
  (gap: Evals panels).
- **Item tabs.** Since library #153 (beta.42) only the selected tab has
  a border, so each tab is within 1.1 px of Figma's width and starts
  within 2 px of its x: Overview starts at 526 against Figma's 524 (the
  list pads 2 px in the default density), and Activity ends at 988.3
  against 989. The selected tab, Evals, is 60.9 × 32 against Figma's
  61 × 34, 2 px lower (y 180 against 178), since `ItemTabs`' selected
  tab is as high as the others (32) and no size token is 34 (gap: Item
  tab width).
- **Rail Artifacts icon.** Figma draws `icon/artifacts` at 20 px
  (482:1492) where the other rail icons are 22; the shared AppRail draws
  every item's icon at 24 (d-100), so the render's icon is 24 and
  `exceptions.json` names 482:1492 (bridge-coord's shared decision,
  2026-11-19).
- **Rail Toolkit icon.** Figma draws `icon/toolkit` at 20 px (482:1497)
  where the other rail icons are 22; the shared AppRail draws every item's
  icon at 24 (d-100), so the render's icon is 24 and `exceptions.json`
  names 482:1497, as for `icon/artifacts`.

## Notifications switch (d-118)

In the app, the rail has a Notifications switch at its end, which this
frame does not draw. Erik asked on 2026-11-21: "Can we get lush
notifications on the phone for this app?" ("lush" is a typo for "push"),
and decision d-118 adds Web Push with this switch to turn it on. It is a
frame exception that the app owns (`web/src/blocks/AppRail.tsx`,
`web/src/blocks/NotificationsSwitch.tsx`). The screen draws the switch
only when the page entry passes `push`; this frame's state and story pass
none, so the checks above are unchanged.
