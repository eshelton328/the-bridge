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

- Text: fail. All 91 Figma strings are in the render, nothing extra shows,
  and no text is covered by another element. Two strings are not visible:
  `Workflows` and `2` (494:818, 494:819), the Workflows chip, which the
  chip row cuts at the list pane's edge, as Figma does (see Kind chips).
- Position: 24 of 32 layers pass, among them every layer of the Files tab
  but two: `file browser`, `tree`, `viewer` and `viewer bar`; and
  `toolkit list`, `header`, `read-only`, `filter · chips`, `search`,
  `group · SKILLS`, `group · AGENTS`, `toolkit item`, `meta row`,
  `kind badge`, `button · Discuss`, `button · Show on map`, `path row` and
  `path badge`, and the rail's six items. The tree's row has no
  `data-figma`: `FileTree` draws it, and it takes no attribute for a row.
- Rules: fail. One `hiddenOverflow` finding: the kind chips scroll
  sideways (`[data-figma="filter · chips"] > div.filter-chips__root`).
  D03 has it in its `exceptions.json`; this frame's `exceptions.json`
  excepts it too. The list fits the pane, and the prompt's lines fit the
  viewer.

## Deviations

- **Row height.** Each list row is 62 px high against Figma's 53
  (`h +9` on every row key; the selected row `h +7`), as on D7: `ListRow`
  pads 10 inside a 1 px border (gap: Toolkit row (pane)). Each row starts
  9 px lower than the one before:
  `toolkit row · diagram-reviewer` y +6;
  `toolkit row · eval-case-writer` y +15;
  `toolkit row · eval-grader` y +24;
  `toolkit row · pr-description-checker` y +33;
  `toolkit row · readme-cold-reader` y +42;
  `toolkit row · writing-reviewer` y +60.
- **Kind chips.** The chip row is wider than the list pane and scrolls
  sideways; Figma cuts the Workflows chip at the same edge, so `Workflows`
  and `2` are not visible in either.
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

## Second review

- **Code gutter.** The line numbers and the code start about 5 px
  further left than Figma's. Figma puts the numbers 14 px in and the
  code 50 px in on every Files frame (D06, D33, D34 `code` 494:1188).
  `CodeLines` sizes its number column to the widest number, and this
  file has 137 lines, so the column differs from Figma's fixed one
  (gap: File preview).
