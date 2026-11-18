# D09 deviations

What still differs from Figma after the last round of the fidelity loop
(`pnpm fidelity toolkit D09`, 2026-11-17, against the installed library
1.0.0-beta.15), each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/hookOpen.ts`: D4's list data with only the
Rules, Workflows and Hooks groups, as the frame draws them, and the hook
commit-msg open beside it. D03, D04 and D07 give the same results as
before D09 (D03: text fail with the same strings, 15 of 53 layers; D04:
text pass, 15 of 49 layers; D07: text pass, 21 of 36 layers; all three
rules pass). The Checks below are from a rerun with library
1.0.0-beta.25 and the item tabs' `tone` and `density` props
(2026-11-17).

The workspace stays on library 1.0.0-beta.15. The code preview is drawn
with beta.15's `CodeLines` (line numbers, syntax colours, lines 19 px
apart as Figma's), which fits D9 better than beta.16's `TerminalLines`
(no line numbers, no comment colour, lines 20 apart).

## Checks

- Text: fail. Three strings are not visible: `hooks/commit-msg`,
  `→1 ←1` and `commit-msg` (433:1446, 433:1448, and the fifth
  `commit-msg` the frame needs, the hook's list row 433:1445; the check
  names 433:1636). All three are the open hook's list row, which the
  render draws below the frame's bottom edge (see Row height). No text
  is covered by another element. In `exceptions.json`: the Workflows
  chip's label and count (433:1315, 433:1316), which Figma cuts at the
  list pane's edge too, and line 4 of the script (433:1595), which
  Figma cuts at the preview's edge too.
- Position: 27 of 49 layers pass (`toolkit list`, `header`, `read-only`,
  `filter · chips`, `search`, `group · RULES`, `toolkit item`,
  `meta row`, `kind badge`, `button · Discuss`, `button · Show on map`,
  `433:1536`, `path row`, `path badge`, `kind section · hook`, `facts`,
  `fact · Event`, `fact · State`, `badge · Enabled · icon`,
  `fact · Enforces`, `fact · Test`).
  The shared navigation's items pass too: `rail · Inbox`,
  `rail · Workspaces`, `rail · Projects`, `rail · Artifacts`,
  `rail · Toolkit` and `rail · More`.
- Rules: fail. One `hiddenOverflow` finding: the list pane
  (`[data-figma="toolkit list"]`) is 1066 px high in a 982 px frame and
  scrolls, because of the taller rows (see Row height). In
  `exceptions.json`: the kind chips scroll sideways, cut at the pane's
  edge (`[data-figma="filter · chips"] > div.filter-chips__root`), and
  the code scrolls sideways in the library's `ScrollFrame`
  (`[data-figma="code"] > div.scroll-frame__root > div.scroll-frame__body`).

## Deviations

- **Row height.** Each list row is 62 px high against Figma's 53 (the
  open row is 62 against 55), and its counts sit level with the name,
  where Figma centres them. `ListRow` pads 10 inside a 1 px border (gap:
  Toolkit row (pane)). The first row starts 3 px lower and each row
  after it 9 px lower again:
  `toolkit row · commits-and-prs` y +3 h +9;
  `toolkit row · diagrams` y +12 h +9; `toolkit row · linear` y +21
  h +9; `toolkit row · readmes` y +30 h +9; `toolkit row · releases`
  y +39 h +9; `toolkit row · skills` y +48 h +9;
  `toolkit row · ste100` y +57 h +9; `toolkit row · writing` y +66 h +9;
  `group · WORKFLOWS` y +75; `toolkit row · skill-eval-cases` y +78 h +9;
  `toolkit row · skill-eval-round` y +87 h +9; `group · HOOKS` y +96;
  `toolkit row · commit-msg` y +99 h +7. The open hook's row starts at
  988, below the frame's bottom edge (982), so its name, path and counts
  (`commit-msg`, `hooks/commit-msg`, `→1 ←1`) are not visible and the
  list pane scrolls (`hiddenOverflow` on `[data-figma="toolkit list"]`).
  The screen does not scroll the pane to the open row: no page builds
  its own scroll layout (d-107).
- **Fact cards.** The four When it runs cards are drawn with `Panel` in
  a four-column `Grid`, 10 apart (gap: Agent fact card). `Panel` is as
  tall as its content, so the Event and Test cards end about 14 px above
  the State and Enforces cards, where Figma draws all four 109 high. The
  cards pad 16 at the sides and 12 at the top against Figma's 15 and 13,
  the head icons are 16 px against 14 (no icon token has 14), and the
  State badge is the library's `Badge size="sm" tone="done"` with a
  12 px check (Figma 11). The four cards pass the position check.
- **Event icon.** The Event card starts with the library's `BranchIcon`
  (a branch with two rings) where Figma draws `icon/git` (a commit mark);
  the library has no git icon (gap: Git icon).
- **Section height.** With the 16 px lines of `small` (Figma 17) and the
  Panel's 12 px padding (Figma 13), the When it runs section is shorter
  than Figma's 136, and the description starts 2 px higher, so
  everything under it starts 5 px higher: `columns` y -5 h -6,
  `file preview` y -5, `preview bar` y -5, `code` y -5, `side` y -5,
  `files` y -5, `file · commit-msg` y -2, `file · test-commit-msg` y -3.
- **Code.** The script is drawn with the library's `CodeLines`, which
  pads 16 (Figma 14 above the first line) and draws 16 px lines 2 apart
  (Figma 17 px lines, 19 apart), so the code box is 210 px high against
  216 (`code` h -6, `file preview` h -6, gap: File preview), and the
  numbers' column is as wide as "10", so the code starts about 4 px
  further left. `CodeLines` scrolls a long line itself but takes no
  keyboard focus, which the story's accessibility check rejects; the
  code keeps its full width inside the library's `ScrollFrame`, whose
  body scrolls it sideways and takes the focus. Line 4 is cut at the
  preview's right edge, as Figma cuts it.
- **Overview columns.** The preview is 554.4 px wide against Figma's 560
  and the side column 369.6 against 364, so the side starts 5.6 px
  further left. No size token has 560 or 364, and the grid shares the
  row 3 to 2 (gap: Item overview columns): `file preview` w -5.6,
  `preview bar` w -5.6, `code` w -5.6, `side` x -5.6 w +5.6,
  `files` x -5.6 w +3.6, `file · commit-msg` x -5.6 w +3.8,
  `file · test-commit-msg` x -5.6 w +3.6 (gap: Item file summary: 16 px
  icons against 14 and the 16 px `mono` line).
- **Description width.** The description is 948 px wide, the content
  width, against Figma's 940 (`433:1537` y -2 w +8): Figma's text box
  ends at its longest line, and the render's paragraph fills its column.
  The 8 px move "is" to the end of line 1, where Figma starts line 2
  with it. No size token has 940.
- **All chip.** The render draws All as the selected chip, because the
  filter is All; Figma D9 draws no chip selected, as D3, D4 and D7 do.
  The app keeps one rule for every frame: the chip of the current filter
  is selected.
- **Buttons, copy button, preview bar.** As in D3, D4 and D7: Discuss and
  Show on map are both 32 px high against Figma's 34 and 36 (gap: Item
  action buttons); the copy icon is a plain button with `CopyIcon` (gap:
  Path badge copy button); the preview box and bar are drawn with the
  Panel's tokens, with a 16 px code icon against 14 (gap: File preview).
  The three pass the position check.
- **Selected tab.** `ItemTabs tone="accent"` (library #126, beta.21)
  draws Overview's label cyan, as Figma's. The outline stays
  `border.selected` at half alpha where Figma's is solid cyan (no solid
  selected token, d-050).
- **Other tabs.** How it works, Files, Links, Evals and Activity show
  empty panels: they are later frames.

## Second review

- **Description break.** Line 1 ends "whether the type is", where
  Figma's ends "whether the type"; see Description width.
