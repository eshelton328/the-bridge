# D36 deviations

What still differs from Figma after round 1 of the fidelity loop
(`pnpm fidelity toolkit D36 D33 D34 D35 D06 D10 D03 D04 D07 D08 D09`,
2026-11-18, against the installed library 1.0.0-beta.31), each with its
reason. The library gaps are in `web/src/pages/toolkit/LIBRARY_GAPS.md`.
The state is `web/src/pages/toolkit/states/hookFiles.ts`: D9's data (the
Rules, Workflows and Hooks groups), with the hook commit-msg open on its
Files tab. D33, D34, D35, D06, D10, D03, D04, D07, D08 and D09 give the
same results as before D36 (each report's text, position and rule results
are unchanged). The frame's `exceptions.json` excepts the strings and the
`hiddenOverflow` findings below, each with the entry that records it; with
them the text and rules checks now pass.

## Checks

From `pnpm fidelity toolkit` on 2026-11-18, after the list rows moved to
`ListRow padding="pane"` and the pane's kind chips to `FilterChips
fade="none"` (library 1.0.0-beta.65), with the frame's
`exceptions.json`.

- Text: pass. `exceptions.json` excepts 2 Figma strings (`Workflows`,
  `2`); each is explained below.
- Position: 35 of 38 layers pass. The 3 that fail: `group · WORKFLOWS` y
  -5; `code` h -10; `used by` y -12. Each is explained below.
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
- **Code.** The tests' 14 lines are 18 px apart against Figma's 19: the
  `mono` line height is 16 on the 4 px grid (d-090), where Figma's is 17,
  and `CodeLines` pads 16 where Figma has 14 (gap: File preview). The code
  box is 282 px high against 292 (`code` h -10), so the line on the last
  run starts 12 px higher (`used by` y -12).
- **Tree rows.** `FileTree` draws each script's role line inside its row,
  under the name, so the selected test-commit-msg's border and fill take
  in its role line (Its tests. Run them after a change to the hook or the
  rule.), which Figma draws under the box from the row's left edge; both
  role lines start under the names, not at the row's edge (gap: File tree
  rows).
- **Tree width.** The tree column is 328 px wide (`shell.sidebar`)
  against Figma's 330, and the viewer 618 against 616; both pass the
  position check (gap: File browser).
- **Browser foot.** Figma's box runs 6 px past the frame's foot; the
  render's ends at the frame's foot, 982 (gap: Item tab panel fill).
- **Copy buttons.** The copy icons in the path badge and the viewer's bar
  are plain buttons with the library's `CopyIcon`, styled with tokens
  (gap: Path badge copy button).
- **Buttons.** Discuss and Show on map are both 32 px high, against
  Figma's 34 and 36, as on D9 (gap: Item action buttons). Both pass the
  position check.
- **Rail Artifacts icon.** Figma draws `icon/artifacts` at 20 px
  (494:2196) where the other rail icons are 22; the shared AppRail draws
  every item's icon at 24 (d-100), so the render's icon is 24 and
  `exceptions.json` names 494:2196 (bridge-coord's shared decision,
  2026-11-19).
- **Rail Toolkit icon.** Figma draws `icon/toolkit` at 20 px (494:2201)
  where the other rail icons are 22; the shared AppRail draws every item's
  icon at 24 (d-100), so the render's icon is 24 and `exceptions.json`
  names 494:2201, as for `icon/artifacts`.
