# D04 deviations

What still differs from Figma after the last round of the fidelity loop
(`pnpm fidelity toolkit D03 D04`, 2026-11-17, against the installed
library 1.0.0-beta.10), each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/ruleOpen.ts`: T1's list with the Workflows
and Hooks groups added, and the rule skills open beside it. D03 gives the
same results as before D04. The numbers below are from the run with
library 1.0.0-beta.15 and `FilterChips padding="none"`, which library
#115 added. The Checks below are from a rerun with library 1.0.0-beta.25
and the item tabs' `tone` and `density` props (2026-11-17).

## Checks

- Text: pass. In `exceptions.json`: the Workflows chip's label and count
  (427:471, 427:472), which Figma cuts at the list pane's edge too; the
  Rules, Workflows and Hooks list text that lies below the frame's bottom
  edge in the render (see List scroll); and the Skills and Agents list
  text that the render shows where Figma has scrolled it away.
- Position: 21 of 55 layers pass (`toolkit list`, `header`, `read-only`,
  `filter · chips`, `search`, `toolkit item`, `meta row`, `kind badge`,
  `button · Discuss`, `button · Show on map`, `427:626`, `path row`,
  `path badge`, `when it loads`, `columns`). The Skills and Agents groups
  and their rows (16 layers) are in `exceptions.json`: the frame has no
  layer for them.
  The shared navigation's items pass too: `rail · Inbox`,
  `rail · Workspaces`, `rail · Projects`, `rail · Artifacts`,
  `rail · Toolkit` and `rail · More`.
- Rules: pass. Two `hiddenOverflow` findings are in `exceptions.json`, as
  in D03: the list pane scrolls on its own (`[data-figma="toolkit list"]`),
  and the kind chips scroll sideways, cut at the pane's edge
  (`[data-figma="filter · chips"] > div.filter-chips__root`).

## Deviations

- **List scroll.** Figma draws the list pane scrolled to the Rules group
  under a pinned header, chips and search. The render's pane starts at
  its header with the Skills group first, as in D3: no page builds its
  own sticky layout until the library's `ScrollFrame` arrives with the
  move to 1.0.0-beta.15 in bridge-inbox's PR (d-107). So the Rules,
  Workflows and Hooks groups sit about 1232 px lower than Figma's and
  below the frame's bottom edge, and the Skills and Agents rows fill the
  pane in their place. With the taller rows (see Row height) each key is
  off by more: `group · RULES` y +1232;
  `toolkit row · commits-and-prs` y +1235 h +9;
  `toolkit row · diagrams` y +1244 h +9; `toolkit row · linear` y +1253
  h +9; `toolkit row · readmes` y +1262 h +9; `toolkit row · releases`
  y +1271 h +9; `toolkit row · skills` y +1280 h +7;
  `toolkit row · ste100` y +1287 h +9; `toolkit row · writing` y +1296
  h +9; `group · WORKFLOWS` y +1305; `toolkit row · skill-eval-cases`
  y +1308 h +9; `toolkit row · skill-eval-round` y +1317 h +9;
  `group · HOOKS` y +1326; `toolkit row · commit-msg` y +1329 h +9.
- **Row height.** Each list row is 62 px high against Figma's 53 (the
  open row is 62 against 55), and its counts sit level with the name,
  where Figma centres them. `ListRow` pads 10 inside a 1 px border (gap:
  Toolkit row (pane)). Each row after the first adds 9 px to the offsets
  above.
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
- **Buttons.** Discuss and Show on map are both 32 px high, against
  Figma's 34 and 36 (gap: Item action buttons). Both pass the position
  check.
- **Copy button.** The copy icon in the path badge is a plain button
  with the library's `CopyIcon`, styled with tokens (gap: Path badge copy
  button).
- **File preview bar.** The box and its bar are drawn with the Panel's
  tokens around `MarkdownView`; the file icon is 16 px against Figma's 14
  (gap: File preview).
- **Nothing links to the rule.** The note says the page says so when
  nothing links to an item. The frame's side column (`side`, 427:652,
  364 × 118) has no layers, so the render leaves the side column empty
  and adds no text; the list row shows `←0`.
- **Selected tab.** `ItemTabs tone="accent"` (library #126, beta.21)
  draws Overview's label cyan, as Figma's. The outline stays
  `border.selected` at half alpha where Figma's is solid cyan (no solid
  selected token, d-050).
- **Other tabs.** How it works, Files, Links, Evals and Activity show
  empty panels: they are later frames (D7 to D9).

## Second review

- **All chip.** The render draws All as the selected chip, because the
  filter is All; Figma D4 draws no chip selected, as D3 does. The app
  keeps one rule for every frame: the chip of the current filter is
  selected (see D03).
- **Preview line break.** The narrower preview (554 against 560 px)
  moves "nobody" to the second line of the first paragraph (gap: Item
  overview columns).
