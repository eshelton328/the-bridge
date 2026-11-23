# D34 deviations

What still differs from Figma after round 1 of the fidelity loop
(`pnpm fidelity toolkit D34 D33 D06 D10 D03 D04 D07 D08 D09`, 2026-11-18,
against the installed library 1.0.0-beta.31), each with its reason. The
library gaps are in `web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/agentFiles.ts`: D7's data (the Skills group
closed, the Agents group open), with the agent writing-reviewer open on its
Files tab. D33, D06, D10, D03, D04, D07, D08 and D09 give the same results
as before D34 (each report's text, position and rule results are
unchanged). The frame's `exceptions.json` excepts the strings and the
`hiddenOverflow` finding below, each with the entry that records it; with
them the text and rules checks now pass.

## Checks

From `pnpm fidelity toolkit` on 2026-11-18, after the list rows moved to
`ListRow padding="pane"` and the pane's kind chips to `FilterChips
fade="none"` (library 1.0.0-beta.65), with the frame's
`exceptions.json`.

- Text: pass. `exceptions.json` excepts 2 Figma strings (`Workflows`,
  `2`); each is explained below.
- Position: 28 of 32 layers pass. The 4 that fail: `toolkit row ·
  diagram-reviewer` y +6; `toolkit row · eval-case-writer` y +5; `code`
  h -10; `used by` y -12. Each is explained below.
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
- **Code.** The prompt's 14 lines are 18 px apart against Figma's 19: the
  `mono` line height is 16 on the 4 px grid (d-090), where Figma's is 17,
  and `CodeLines` pads 16 where Figma has 14 (gap: File preview). The code
  box is 282 px high against 292 (`code` h -10), so the line on what
  starts the agent starts 12 px higher (`used by` y -12).
- **Tree row.** The prompt's one row is selected, and `FileTree` draws its
  role line (The prompt. Its model and tools are in the frontmatter.)
  inside the row, under the name: the selection's border and fill take in
  the role line. Figma draws the selected box around the name and the
  count only, with the role line under it from the row's left edge (gap:
  File tree rows).
- **Tree width.** The tree column is 328 px wide (`shell.sidebar`)
  against Figma's 330, and the viewer 618 against 616; both pass the
  position check (gap: File browser).
- **Browser foot.** Figma's box runs 6 px past the frame's foot; the
  render's ends at the frame's foot, 982 (gap: Item tab panel fill).
- **Copy buttons.** The copy icons in the path badge and the viewer's bar
  are plain buttons with the library's `CopyIcon`, styled with tokens
  (gap: Path badge copy button).
- **Buttons.** Discuss and Show on map are both 32 px high, against
  Figma's 34 and 36, as on D7 (gap: Item action buttons). Both pass the
  position check.
- **Rail Artifacts icon.** Figma draws `icon/artifacts` at 20 px (494:774)
  where the other rail icons are 22; the shared AppRail draws every item's
  icon at 24 (d-100), so the render's icon is 24 and `exceptions.json`
  names 494:774 (bridge-coord's shared decision, 2026-11-19).
- **Rail Toolkit icon.** Figma draws `icon/toolkit` at 20 px (494:779)
  where the other rail icons are 22; the shared AppRail draws every item's
  icon at 24 (d-100), so the render's icon is 24 and `exceptions.json`
  names 494:779, as for `icon/artifacts`.

## Second review

- **Code gutter.** The line numbers and the code start about 5 px
  further left than Figma's. Figma puts the numbers 14 px in and the
  code 50 px in on every Files frame (D06, D33, D34 `code` 494:1188).
  `CodeLines` sizes its number column to the widest number, and this
  file has 137 lines, so the column differs from Figma's fixed one
  (gap: File preview).

## Settings gear (d-119)

In the app, the rail has a Settings gear before More, which this frame
does not draw: Settings has no Figma page, and decision d-119 puts its
entry in the rail (`web/src/blocks/AppRail.tsx`). The Notifications
switch that d-118 put at the rail's end moved to the Settings page, so
the rail no longer draws it. The screen draws the gear only when the
page entry passes `settingsEntry`; this frame's state and story pass
none, so the checks above are unchanged.
