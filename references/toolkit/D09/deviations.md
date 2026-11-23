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

From `pnpm fidelity toolkit` on 2026-11-18, after the list rows moved to
`ListRow padding="pane"` and the pane's kind chips to `FilterChips
fade="none"` (library 1.0.0-beta.65), with the frame's
`exceptions.json`.

- Text: pass. `exceptions.json` excepts 3 Figma strings (`Workflows`,
  `2`, `# exits 1 with one line per problem. Git runs it from the top of
  the work`); each is explained below. The Test card's caption `runs
  the rule’s ✗ and ✓ examples` (433:1570) passes with no exception
  since the text check change of 2026-11-19 (see Cross glyph).
- Position: 39 of 49 layers pass. The 10 that fail: `group · WORKFLOWS`
  y -5; `433:1537` w +8; `columns` y -5, h -6; `file preview` y -5, w
  -5.6, h -6; `preview bar` y -5, w -5.6; `code` y -5, w -5.6, h -6;
  `side` x -5.6, y -5, w +5.6; `files` x -5.6, y -5; `file · commit-msg`
  x -5.6; `file · test-commit-msg` x -5.6. Each is explained below.
- Rules: pass. 2 findings are excepted in `exceptions.json`:
  `hiddenOverflow` on `[data-figma="filter · chips"] >
  div.filter-chips__root`; `hiddenOverflow` on `[data-figma="code"] >
  div.scroll-frame__root > div.scroll-frame__body`.

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
  Path badge copy button); the preview box and bar are drawn by the library's `FileFrame`, with a 16 px code icon against 14 (gap: File preview).
  The three pass the position check.
- **Selected tab.** `ItemTabs tone="accent"` (library #126, beta.21)
  draws Overview's label cyan, as Figma's. The outline stays
  `border.selected` at half alpha where Figma's is solid cyan (no solid
  selected token, d-050).
- **Other tabs.** How it works, Files, Links, Evals and Activity show
  empty panels: they are later frames.
- **Cross glyph.** The Test card's caption has Figma's ✗ (U+2717) and ✓ (U+2713). Since
  library 1.0.0-beta.67 (2026-11-19) they are the library's `Glyph`,
  which keeps each character in the text and draws Figma's slanted cross
  and thin check in its place, where the font drew an upright "×". The
  glyph keeps the character at font size 0 and transparent; since the
  text check change of 2026-11-19 the check measures a Glyph's character
  by its icon (shown, at least 1 px, in view and not covered), so the
  string (433:1570) passes with no exception.
- **Rail Artifacts icon.** Figma draws `icon/artifacts` at 20 px
  (433:1271) where the other rail icons are 22; the shared AppRail draws
  every item's icon at 24 (d-100), so the render's icon is 24 and
  `exceptions.json` names 433:1271 (bridge-coord's shared decision,
  2026-11-19).
- **Rail Toolkit icon.** Figma draws `icon/toolkit` at 20 px (433:1276)
  where the other rail icons are 22; the shared AppRail draws every item's
  icon at 24 (d-100), so the render's icon is 24 and `exceptions.json`
  names 433:1276, as for `icon/artifacts`.

## Second review

- **Description break.** Line 1 ends "whether the type is", where
  Figma's ends "whether the type"; see Description width.

## Settings gear (d-119)

In the app, the rail has a Settings gear before More, which this frame
does not draw: Settings has no Figma page, and decision d-119 puts its
entry in the rail (`web/src/blocks/AppRail.tsx`). The Notifications
switch that d-118 put at the rail's end moved to the Settings page, so
the rail no longer draws it. The screen draws the gear only when the
page entry passes `settingsEntry`; this frame's state and story pass
none, so the checks above are unchanged.
