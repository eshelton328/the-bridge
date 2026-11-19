# D06 deviations

What still differs from Figma after round 3 of the fidelity loop
(`pnpm fidelity toolkit D06 D03 D07 D14 D13 T07`, 2026-11-17, against the
installed library 1.0.0-beta.31), each with its reason. The library gaps
are in `web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/skillFiles.ts`: D3's data (the list has T1's
data), with writer open on its Files tab. D03, D07, D14, D13 and T07 give
the same results as before D06 (each report's text, position and rule
results are unchanged). The frame's `exceptions.json` excepts the strings
and the `hiddenOverflow` findings below, each with the entry that records
it; with them the text and rules checks now pass.

## Checks

From `pnpm fidelity toolkit` on 2026-11-18, after the list rows moved to
`ListRow padding="pane"` and the pane's kind chips to `FilterChips
fade="none"` (library 1.0.0-beta.65), with the frame's
`exceptions.json`.

- Text: pass. `exceptions.json` excepts 2 Figma strings (`Workflows`,
  `2`); each is explained below.
- Position: 32 of 50 layers pass. The 18 that fail: `group · AGENTS` y
  -8; `toolkit row · diagram-reviewer` y -5; `toolkit row ·
  eval-case-writer` y -6; `toolkit row · eval-grader` y -7; `toolkit row
  · pr-description-checker` y -8; `toolkit row · readme-cold-reader` y
  -9; `toolkit row · writing-reviewer` y -11; `group · RULES` noLayer;
  `toolkit row · commits-and-prs` noLayer; `toolkit row · diagrams`
  noLayer; `toolkit row · linear` noLayer; `toolkit row · readmes`
  noLayer; `toolkit row · releases` noLayer; `toolkit row · skills`
  noLayer; `toolkit row · ste100` noLayer; `toolkit row · writing`
  noLayer; `code` h -10; `used by` y -12. Each is explained below.
- Rules: pass. 3 findings are excepted in `exceptions.json`:
  `hiddenOverflow` on `[data-figma="toolkit list"]`; `hiddenOverflow` on
  `[data-figma="filter · chips"] > div.filter-chips__root`;
  `hiddenOverflow` on `[data-figma="code"] > div.scroll-frame__root >
  div.scroll-frame__body`.

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
  `toolkit row · writing` have no layer in the frame (`noLayer`). D3 has
  the same rows in its `exceptions.json`.
- **Kind chips.** The chip row is wider than the list pane and scrolls
  sideways; Figma cuts the Workflows chip at the same edge, so
  `Workflows` and `2` are not visible in either. `FilterChips
  fade="none"` (library 1.0.0-beta.65) draws the cut chip at full
  strength up to the pane's edge, as Figma does.
- **Code.** The script's 14 lines are 18 px apart against Figma's 19: the
  `mono` line height is 16 on the 4 px grid (d-090), where Figma's is 17,
  and `CodeLines` pads 16 where Figma has 14 (gap: File preview). The code
  box is 282 px high against 292 (`code` h -10), so the line under it
  starts 12 px higher (`used by` y -12). Line 13 is longer than the viewer;
  Figma cuts it at the viewer's edge, and the render scrolls it sideways
  in the code's `ScrollFrame`, as the Overview's code does (D9), which the
  rule check reports as `hiddenOverflow`.
- **Tree rows.** `FileTree` indents a folder's files 16 px, so each file
  of references/, scripts/ and evals/ starts 17 px further right than
  Figma's, where Figma puts the file's icon under the folder's chevron. A
  folder's role line (Read on demand, Run, not read, Test cases…) starts
  under the folder's name, not at the row's left edge, so the evals/ line
  wraps onto two lines. Each eval case folder shows a closed chevron
  before its folder icon, where Figma shows the icon alone. Rows are 26
  px high and 28 apart against Figma's 27 and 29, so the last row,
  precheck.sh, ends about 20 px higher (gap: File tree rows).
- **Tree width.** The tree column is 328 px wide (`shell.sidebar`, the
  file tree's width) against Figma's 330, and the viewer 618 against 616;
  both pass the position check (gap: File browser).
- **Browser foot.** Figma's box runs 6 px past the frame's foot (it ends
  at 988); the render's ends at the frame's foot, 982. The box, the tree
  and the viewer pass the position check.
- **Copy button.** The copy icon in the viewer's bar is a plain button
  with the library's `CopyIcon`, styled with tokens, as the path badge's
  is (gap: Path badge copy button).
- **Buttons.** Discuss and Show on map are both 32 px high, against
  Figma's 34 and 36, as on D3 (gap: Item action buttons). Both pass the
  position check.

## Second review

- **List row counts.** The change counts sit level with each row's name,
  where Figma centres them in the row. The list pane is D3's; D3's
  deviations record the same (Toolkit row (pane)).
- **All chip.** The render draws All as the selected chip, with the
  selected fill and border, as D3's deviations record.
