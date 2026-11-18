# D36 deviations

What still differs from Figma after round 1 of the fidelity loop
(`pnpm fidelity toolkit D36 D33 D34 D35 D06 D10 D03 D04 D07 D08 D09`,
2026-11-18, against the installed library 1.0.0-beta.28), each with its
reason. The library gaps are in `web/src/pages/toolkit/LIBRARY_GAPS.md`.
The state is `web/src/pages/toolkit/states/hookFiles.ts`: D9's data (the
Rules, Workflows and Hooks groups), with the hook commit-msg open on its
Files tab. D33, D34, D35, D06, D10, D03, D04, D07, D08 and D09 give the
same results as before D36 (each report's text, position and rule results
are unchanged). The frame has no `exceptions.json`.

## Checks

- Text: fail. All 109 Figma strings are in the render, nothing extra
  shows, and no text is covered by another element. Five strings are not
  visible, all for the list pane, which D9 shares:
  - `Workflows` and `2` (494:2240, 494:2241), the Workflows chip, which
    the chip row cuts at the list pane's edge, as Figma does (see Kind
    chips).
  - `hooks/commit-msg` and `→1 ←1` (494:2371, 494:2373), and one of the
    frame's three `commit-msg` strings, which the check names by the tree
    row's layer (494:2759): the taller list rows push the Hooks group's
    row, commit-msg, past the frame's bottom edge (see Row height). The
    title and the tree row show commit-msg in full, so two of the three
    layers have a visible match and the list row's does not.
- Position: 23 of 38 layers pass, among them every layer of the Files tab
  but two: `file browser`, `tree`, `viewer` and `viewer bar`; and
  `toolkit list`, `header`, `read-only`, `filter · chips`, `search`,
  `group · RULES`, `toolkit item`, `meta row`, `kind badge`,
  `button · Discuss`, `button · Show on map`, `path row` and
  `path badge`, and the rail's six items. The tree's rows have no
  `data-figma`: `FileTree` draws them, and it takes no attribute for a
  row.
- Rules: fail. Two `hiddenOverflow` findings: the list pane scrolls on its
  own (`[data-figma="toolkit list"]`), and the kind chips scroll sideways
  (`[data-figma="filter · chips"] > div.filter-chips__root`). D03 has both
  in its `exceptions.json`; this frame takes no exceptions. The tests'
  lines fit the viewer.

## Deviations

- **Row height.** Each list row is 62 px high against Figma's 53
  (`h +9` on every row key; the selected row `h +7`), as on D9:
  `ListRow` pads 10 inside a 1 px border (gap: Toolkit row (pane)). The
  first row starts within the tolerance and each row after it 9 px lower
  again: `toolkit row · commits-and-prs` h +9;
  `toolkit row · diagrams` y +12; `toolkit row · linear` y +21;
  `toolkit row · readmes` y +30; `toolkit row · releases` y +39;
  `toolkit row · skills` y +48; `toolkit row · ste100` y +57;
  `toolkit row · writing` y +66; `group · WORKFLOWS` y +75;
  `toolkit row · skill-eval-cases` y +78;
  `toolkit row · skill-eval-round` y +87; `group · HOOKS` y +96;
  `toolkit row · commit-msg` y +99.
- **Kind chips.** The chip row is wider than the list pane and scrolls
  sideways; Figma cuts the Workflows chip at the same edge, so `Workflows`
  and `2` are not visible in either.
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
