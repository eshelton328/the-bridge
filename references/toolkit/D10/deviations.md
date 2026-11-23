# D10 deviations

What still differs from Figma after round 2 of the fidelity loop
(`pnpm fidelity toolkit D10 D06 D03 D07 D14 D13`, 2026-11-18, against the
installed library 1.0.0-beta.31), each with its reason. The library gaps
are in `web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/scriptExplained.ts`: D6's data (the list has
T1's data), with writer open on its Files tab and its script check on
Explain. D06, D03, D07, D14 and D13 give the same results as before D10
(each report's text, position and rule results are unchanged). The frame's
`exceptions.json` excepts the strings and the `hiddenOverflow` findings
below, each with the entry that records it; with them the text and rules
checks now pass.

## Checks

From `pnpm fidelity toolkit` on 2026-11-18, after the list rows moved to
`ListRow padding="pane"` and the pane's kind chips to `FilterChips
fade="none"` (library 1.0.0-beta.65), with the frame's
`exceptions.json`.

- Text: pass. `exceptions.json` excepts 2 Figma strings (`Workflows`,
  `2`); each is explained below.
- Position: 35 of 51 layers pass. The 16 that fail: `group · AGENTS` y
  -8; `toolkit row · diagram-reviewer` y -5; `toolkit row ·
  eval-case-writer` y -6; `toolkit row · eval-grader` y -7; `toolkit row
  · pr-description-checker` y -8; `toolkit row · readme-cold-reader` y
  -9; `toolkit row · writing-reviewer` y -11; `group · RULES` noLayer;
  `toolkit row · commits-and-prs` noLayer; `toolkit row · diagrams`
  noLayer; `toolkit row · linear` noLayer; `toolkit row · readmes`
  noLayer; `toolkit row · releases` noLayer; `toolkit row · skills`
  noLayer; `toolkit row · ste100` noLayer; `toolkit row · writing`
  noLayer. Each is explained below.
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
  frame's foot and is visible, so its exceptions are gone. The list
  still runs past the frame's foot, so the pane scrolls on its own
  (`hiddenOverflow` on `[data-figma="toolkit list"]`, in
  `exceptions.json`).
- **Rules group.** The list has T1's data, so the Rules group lies below
  the frame: `group · RULES` and its rows `toolkit row · commits-and-prs`,
  `toolkit row · diagrams`, `toolkit row · linear`,
  `toolkit row · readmes`, `toolkit row · releases`,
  `toolkit row · skills`, `toolkit row · ste100` and
  `toolkit row · writing` have no layer in the frame (`noLayer`), as on
  D6.
- **Kind chips.** The chip row is wider than the list pane and scrolls
  sideways; Figma cuts the Workflows chip at the same edge, so
  `Workflows` and `2` are not visible in either. `FilterChips
  fade="none"` (library 1.0.0-beta.65) draws the cut chip at full
  strength up to the pane's edge, as Figma does.
- **Explanation spacing.** The library's `ScriptExplanation` pads 20
  where Figma pads 18, and its overview card pads 16 by 12 where Figma's
  pads 15 by 13, so the overview, the walkthrough label and the steps sit
  about 2 px further in and lower. The facts put the keys in a 40 px
  column (library #141, beta.36), so the In, Out and Exit values start 50
  after their keys, as Figma's. The step numbers are 24 px circles against Figma's 22,
  and the note's spark icon is 12 px against 13. Step 2's text wraps one
  word earlier ("stop" moves to the second line). The `explain` box and
  the `used by` line under it pass the position check (gap: Script
  explanation).
- **Switch height.** The Explain and Code switch is 32 px high
  (`ViewSwitch` at `md`) against Figma's 34, so the viewer's bar is 52
  high against 54 and the explanation starts 2 px higher; the switch and
  the bar pass the position check (gap: Explain and Code switch).
- **Tree rows.** As on D6, `FileTree` indents a folder's files 16 px, puts
  a folder's role line under its name (so the evals/ line wraps), shows a
  closed chevron before each eval case folder, and draws rows 26 px high
  and 28 apart against Figma's 27 and 29 (gap: File tree rows).
- **Tree width.** The tree column is 328 px wide (`shell.sidebar`)
  against Figma's 330, and the viewer 618 against 616; both pass the
  position check (gap: File browser).
- **Browser foot.** Figma's box runs 6 px past the frame's foot (it ends
  at 988); the render's ends at the frame's foot, 982. The open tab panel
  grows to fill the pane through a selector on the library's DOM (gap:
  Item tab panel fill).
- **Copy button.** The copy icon in the viewer's bar is a plain button
  with the library's `CopyIcon`, styled with tokens, as the path badge's
  is (gap: Path badge copy button).
- **Buttons.** Discuss and Show on map are both 32 px high, against
  Figma's 34 and 36, as on D3 (gap: Item action buttons). Both pass the
  position check.
- **Rail Artifacts icon.** Figma draws `icon/artifacts` at 20 px (440:962)
  where the other rail icons are 22; the shared AppRail draws every item's
  icon at 24 (d-100), so the render's icon is 24 and `exceptions.json`
  names 440:962 (bridge-coord's shared decision, 2026-11-19).
- **Rail Toolkit icon.** Figma draws `icon/toolkit` at 20 px (440:967)
  where the other rail icons are 22; the shared AppRail draws every item's
  icon at 24 (d-100), so the render's icon is 24 and `exceptions.json`
  names 440:967, as for `icon/artifacts`.

## Second review

- **Navigation rail.** The rail's items from Inbox down sit 4 to 5 px
  higher than Figma's. The rail is the shared app frame, not the
  Toolkit page; D14's second review found the same and sent it to the
  coordinator.

## Library beta.36 parts

The desktop keeps `ScriptExplanation`'s `wide` layout (its default); the
phone takes the library's `narrow` layout (library #141).
`pnpm fidelity toolkit` on every Toolkit frame before and after the change
(2026-11-18) gives D10 the same results: the same text and rule findings
and the same 27 of 51 passing layers.

## Settings gear (d-119)

In the app, the rail has a Settings gear before More, which this frame
does not draw: Settings has no Figma page, and decision d-119 puts its
entry in the rail (`web/src/blocks/AppRail.tsx`). The Notifications
switch that d-118 put at the rail's end moved to the Settings page, so
the rail no longer draws it. The screen draws the gear only when the
page entry passes `settingsEntry`; this frame's state and story pass
none, so the checks above are unchanged.
