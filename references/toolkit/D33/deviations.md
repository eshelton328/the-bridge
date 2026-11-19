# D33 deviations

What still differs from Figma after round 2 of the fidelity loop
(`pnpm fidelity toolkit D33 D06 D10 D03 D04 D07 D08 D09`, 2026-11-18,
against the installed library 1.0.0-beta.31), each with its reason. The
library gaps are in `web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/ruleFiles.ts`: D4's data with D37's list (the
Rules, Workflows and Hooks groups), with the rule skills open on its Files
tab. D06, D10, D03, D04, D07, D08 and D09 give the same results as before
D33 (each report's text, position and rule results are unchanged). The
frame's `exceptions.json` excepts the strings and the `hiddenOverflow`
findings below, each with the entry that records it; with them the text and
rules checks now pass.

## Checks

- Text: fail. All Figma strings are in the render, nothing extra shows,
  and no text is covered by another element. Five strings are not visible,
  all in the list pane, which D37 and D9 share:
  - `Workflows` and `2` (494:181, 494:182), the Workflows chip, which the
    chip row cuts at the list pane's edge, as Figma does (see Kind chips).
  - `commit-msg`, `hooks/commit-msg` and `→1 ←1` (494:311, 494:312,
    494:314): the taller list rows push the Hooks group's row past the
    frame's bottom edge (see Row height).
- Position: 23 of 38 layers pass, among them every layer of the Files tab
  but two: `file browser`, `tree`, `viewer` and `viewer bar`; and
  `toolkit list`, `header`, `read-only`, `filter · chips`, `search`,
  `group · RULES`, `toolkit item`, `meta row`, `kind badge`,
  `button · Discuss`, `button · Show on map`, `path row` and
  `path badge`, and the rail's items `rail · Inbox`, `rail · Workspaces`,
  `rail · Projects`, `rail · Artifacts`, `rail · Toolkit` and
  `rail · More`. The tree's row has no `data-figma`: `FileTree` draws it,
  and it takes no attribute for a row.
- Rules: fail. Two `hiddenOverflow` findings: the list pane scrolls on its
  own (`[data-figma="toolkit list"]`), and the kind chips scroll sideways
  (`[data-figma="filter · chips"] > div.filter-chips__root`). D03 has both
  in its `exceptions.json`; this frame's `exceptions.json` excepts them
  too. The rule's lines fit the viewer, so its code does not scroll
  sideways.

## Deviations

- **Row height.** Each list row is 62 px high against Figma's 53
  (`h +9` on every row key; the selected row `h +7`), as on D4 and D37:
  `ListRow` pads 10 inside a 1 px border (gap: Toolkit row (pane)). The
  first row starts within the tolerance and each row after it 9 px lower
  again: `toolkit row · commits-and-prs` h +9;
  `toolkit row · diagrams` y +12; `toolkit row · linear` y +21;
  `toolkit row · readmes` y +30; `toolkit row · releases` y +39;
  `toolkit row · skills` y +48; `toolkit row · ste100` y +55;
  `toolkit row · writing` y +64; `group · WORKFLOWS` y +73;
  `toolkit row · skill-eval-cases` y +76;
  `toolkit row · skill-eval-round` y +85; `group · HOOKS` y +94;
  `toolkit row · commit-msg` y +97.
- **Kind chips.** The chip row is wider than the list pane and scrolls
  sideways; Figma cuts the Workflows chip at the same edge, so `Workflows`
  and `2` are not visible in either.
- **Code.** The rule's 14 lines are 18 px apart against Figma's 19: the
  `mono` line height is 16 on the 4 px grid (d-090), where Figma's is 17,
  and `CodeLines` pads 16 where Figma has 14 (gap: File preview). The code
  box is 282 px high against 292 (`code` h -10), so the line on when the
  rule loads starts 12 px higher (`used by` y -12).
- **Tree row.** The rule's one row is selected, and `FileTree` draws its
  role line (The rule. Claude Code loads it by the paths in its
  frontmatter.) inside the row, under the name: the selection's border and
  fill take in the role line, and the line starts under the name and wraps
  at another word. Figma draws the selected box around the name and the
  count only, with the role line under it from the row's left edge (gap:
  File tree rows).
- **Tree width.** The tree column is 328 px wide (`shell.sidebar`, the
  file tree's width) against Figma's 330, and the viewer 618 against 616;
  both pass the position check (gap: File browser).
- **Browser foot.** Figma's box runs 6 px past the frame's foot (it ends
  at 988); the render's ends at the frame's foot, 982. The box, the tree
  and the viewer pass the position check (gap: Item tab panel fill).
- **Copy buttons.** The copy icons in the path badge and the viewer's bar
  are plain buttons with the library's `CopyIcon`, styled with tokens
  (gap: Path badge copy button).
- **Buttons.** Discuss and Show on map are both 32 px high, against
  Figma's 34 and 36, as on D4 (gap: Item action buttons). Both pass the
  position check.
