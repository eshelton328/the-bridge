# D04 deviations

What still differs from Figma after round 2 of the fidelity loop
(`pnpm fidelity toolkit D03 D04`, 2026-11-17, against the installed
library 1.0.0-beta.10), each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/ruleOpen.ts`: T1's list with the Workflows
and Hooks groups added, and the rule skills open beside it. D03 gives the
same results as before D04.

## Checks

- Text: fail. Every Figma string is in the render. Three strings are not
  visible, because the taller list rows push the Hooks row past the
  frame's bottom edge (see Row height): `commit-msg` (427:601),
  `hooks/commit-msg` (427:602) and `→1 ←1` (427:604). In
  `exceptions.json`: the Workflows chip's label and count (427:471,
  427:472), which Figma cuts at the list pane's edge too, and five strings
  of the last Agents rows (`writer`, `agents/writer.md`,
  `writing-reviewer`, `agents/writing-reviewer.md`, `→3 ←4`), which lie
  behind the pinned header, chips and search, where the text check cannot
  see that they are covered.
- Position: 16 of 49 layers pass (`toolkit list`, `header`,
  `read-only`, `filter · chips`, `search`, `group · RULES`,
  `toolkit item`, `meta row`, `kind badge`, `button · Discuss`,
  `button · Show on map`, `427:626`, `path row`, `path badge`,
  `when it loads`, `columns`). The Skills and Agents groups and their rows
  (16 layers) are in `exceptions.json`: the frame's list is scrolled to
  the Rules group, so it has no layer for them.
- Rules: pass. Two `hiddenOverflow` findings are in `exceptions.json`, as
  in D03: the list pane scrolls on its own (`[data-figma="toolkit list"]`),
  and the kind chips scroll sideways, cut at the pane's edge
  (`[data-figma="filter · chips"] > div.filter-chips__root`).

## Deviations

- **Row height.** Each list row is 62 px high against Figma's 53
  (`h +9` on every row key; the open row is 62 against 55, `h +7`), and
  its counts sit level with the name, where Figma centres them. `ListRow`
  pads 10 inside a 1 px border (gap: Toolkit row (pane)). The first row
  starts 7 px lower and each row after it 9 px lower again:
  `toolkit row · commits-and-prs` y +7; `toolkit row · diagrams` y +16;
  `toolkit row · linear` y +25; `toolkit row · readmes` y +34;
  `toolkit row · releases` y +43; `toolkit row · skills` y +52;
  `toolkit row · ste100` y +59; `toolkit row · writing` y +68;
  `group · WORKFLOWS` y +77; `toolkit row · skill-eval-cases` y +80;
  `toolkit row · skill-eval-round` y +89; `group · HOOKS` y +98;
  `toolkit row · commit-msg` y +101. So the Hooks row (commit-msg) lies
  below the frame's bottom edge, and only the Hooks header shows.
- **File preview width.** The preview is 554.4 px wide against Figma's
  560: no size token has 560 or 364, and the columns share the row 3 to 2
  even with the side column empty (gap: Item overview columns):
  `file preview` w -5.6, `preview bar` w -5.6, `rendered markdown`
  w -5.6.
- **Description width.** The description is 948 px wide, the content
  width, against Figma's 940 (`427:627` w +8): Figma's text box ends at
  its longest line, and the render's paragraph fills its column. The two
  lines break at the same word.
- **Load box.** The box that says when the rule loads is 46 px high and
  514 wide against Figma's 42 and 512: `Panel tone="needsYou"` pads 12
  above and below and 16 at the sides, where Figma has 10 and 14 (gap:
  Rule load box). It passes the position check; the preview under it
  starts 4 px lower.
- **Pinned list top.** The header, chips and search stay at the list
  pane's top, and the pane opens scrolled so the open rule's group (Rules)
  is first under the search, as Figma draws it. The pinned block has the
  pane's fill and blur over the pane's own, so it is a little darker than
  the rows when stars lie behind it.
- **Buttons.** Discuss and Show on map are both 32 px high, against
  Figma's 34 and 36 (gap: Item action buttons). Both pass the position
  check.
- **Copy button.** The copy icon in the path badge is a plain button
  with the library's `CopyIcon`, styled with tokens (gap: Path badge copy
  button).
- **File preview bar.** The box and its bar are drawn with the Panel's
  tokens around `MarkdownView`; the file icon is 16 px against Figma's 14
  (gap: File preview).
- **Rail.** The rail items are 54 px high and 60 px apart against
  Figma's 50 and 56, so Workspaces to More sit 4 to 20 px lower (gap:
  Rail item height). The rail has no `data-figma` in this frame.
- **Nothing links to the rule.** The note says the page says so when
  nothing links to an item. The frame's side column (`side`, 427:652,
  364 × 118) has no layers, so the render leaves the side column empty
  and adds no text; the list row shows `←0`.
- **Other tabs.** How it works, Files, Links, Evals and Activity show
  empty panels: they are later frames (D7 to D9).
