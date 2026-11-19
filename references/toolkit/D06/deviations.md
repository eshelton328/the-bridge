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

- Text: fail. All 153 Figma strings are in the render, nothing extra
  shows, and no text is covered by another element. Six strings are not
  visible, all in the list pane, which D3 shares:
  - `Workflows` and `2` (432:1818, 432:1819), the Workflows chip, which
    the chip row cuts at the list pane's edge, as Figma does (see Kind
    chips).
  - `agents/eval-case-writer.md` (432:1933), and `eval-grader`,
    `agents/eval-grader.md` and `→0 ←2` (432:1942, 432:1943, 432:1945):
    the taller list rows push them past the frame's bottom edge (see Row
    height).
- Position: 24 of 50 layers pass, among them every layer of the Files tab
  but two: `file browser`, `tree`, `viewer` and `viewer bar`; and
  `toolkit list`, `header`, `read-only`, `filter · chips`, `search`,
  `group · SKILLS`, `toolkit item`, `meta row`, `kind badge`,
  `button · Discuss`, `button · Show on map`, `432:2010` (the title
  writer), `path row` and `path badge`. The shared navigation's items
  pass too: `rail · Inbox`, `rail · Workspaces`, `rail · Projects`,
  `rail · Artifacts`, `rail · Toolkit` and `rail · More`. The tree's rows
  have no `data-figma`: `FileTree` draws them, and it takes no attribute
  for a row.
- Rules: fail. Three `hiddenOverflow` findings: the list pane scrolls on
  its own (`[data-figma="toolkit list"]`), the kind chips scroll sideways
  (`[data-figma="filter · chips"] > div.filter-chips__root`), and the
  script's code scrolls sideways
  (`[data-figma="code"] > div.scroll-frame__root > div.scroll-frame__body`,
  see Code). D03 has the first two in its `exceptions.json`; this frame's
  `exceptions.json` excepts all three.

## Deviations

- **Row height.** Each list row is 62 px high against Figma's 53
  (`h +9` on every row key), as on D3: `ListRow` pads 10 inside a 1 px
  border (gap: Toolkit row (pane)). The first row starts within the
  tolerance and each row after it 9 px lower again:
  `toolkit row · agents-md` h +9; `toolkit row · ambitious` y +12;
  `toolkit row · audit-slop` y +21; `toolkit row · eval-cases` y +30;
  `toolkit row · mermaid-diagrams` y +39;
  `toolkit row · pr-description` y +48;
  `toolkit row · project-setup` y +57; `toolkit row · readme` y +66;
  `group · AGENTS` y +82; `toolkit row · diagram-reviewer` y +85;
  `toolkit row · eval-case-writer` y +94;
  `toolkit row · eval-grader` y +103;
  `toolkit row · pr-description-checker` y +112;
  `toolkit row · readme-cold-reader` y +121;
  `toolkit row · writing-reviewer` y +139.
- **Rules group.** The list has T1's data, so the Rules group lies below
  the frame: `group · RULES` and its rows `toolkit row · commits-and-prs`,
  `toolkit row · diagrams`, `toolkit row · linear`,
  `toolkit row · readmes`, `toolkit row · releases`,
  `toolkit row · skills`, `toolkit row · ste100` and
  `toolkit row · writing` have no layer in the frame (`noLayer`). D3 has
  the same rows in its `exceptions.json`.
- **Kind chips.** The chip row is wider than the list pane and scrolls
  sideways; Figma cuts the Workflows chip at the same edge, so `Workflows`
  and `2` are not visible in either.
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
