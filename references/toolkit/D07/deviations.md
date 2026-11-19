# D07 deviations

What still differs from Figma after the last round of the fidelity loop
(`pnpm fidelity toolkit D07`, 2026-11-17, against the installed library
1.0.0-beta.15), each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/agentOpen.ts`: T1's list data with only the
Skills and Agents groups, as the frame draws them, the Skills group
closed, and the agent writing-reviewer open beside it. D03 and D04 give
the same results as before D07 (D03: text fail with the same four strings,
15 of 53 layers; D04: text pass, 15 of 49 layers; both rules pass). The
Checks below are from a rerun with library 1.0.0-beta.25 and the item
tabs' `tone` and `density` props (2026-11-17).

## Checks

From `pnpm fidelity toolkit` on 2026-11-18, after the list rows moved to
`ListRow padding="pane"` and the pane's kind chips to `FilterChips
fade="none"` (library 1.0.0-beta.65), with the frame's
`exceptions.json`.

- Text: pass. `exceptions.json` excepts 2 Figma strings (`Workflows`,
  `2`); each is explained below.
- Position: 31 of 42 layers pass. The 11 that fail: `toolkit row ·
  diagram-reviewer` y +6; `toolkit row · eval-case-writer` y +5;
  `433:525` w +8; `columns` y -6, h +17; `file preview` y -6, w -5.6, h
  +17; `preview bar` y -6, w -5.6; `rendered markdown` y -6, w -5.6, h
  +17; `side` x -5.6, y -6, w +5.6; `used in workflows` x -5.6, y -6, w
  +5.6; `files` x -5.6, y -5; `file · writing-reviewer.md` x -5.6. Each
  is explained below.
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
- **Fact cards.** The four How it runs cards are drawn with `Panel` in a
  four-column `Grid`, 10 apart (gap: Agent fact card). `Panel` is as
  tall as its content, so the Claude, Codex and Tools cards are about
  88 px high and end about 16 px above the Context card (104), where
  Figma draws all four 109 high. The position check measures each
  card's grid cell (`fact · …`, which passes); the visible borders of the
  three one-line cards are the shorter ones. The cards pad 16 at the
  sides and 12 at the top against Figma's 15 and 13, and the head icons
  are 16 px against 14 (no icon token has 14).
- **Section height.** With the 16 px lines of `small` and `mono` (Figma
  17) and the Panel's 12 px padding (Figma 13), the How it runs section
  is 131 px high against 136, and the description starts 2 px higher,
  so everything under it starts 6 px higher: `columns` y -6, and the
  keys below.
- **Prompt preview.** The rendered prompt is 17 px taller than Figma's
  (`columns` h +17, `file preview` h +17, `rendered markdown` h +17):
  `MarkdownView` spaces its title, paragraphs and heading on the 4 px
  grid (d-072), and the narrower preview moves "open" to the third line
  of the first paragraph.
- **Overview columns.** The preview is 554.4 px wide against Figma's 560
  and the side column 369.6 against 364, so the side starts 5.6 px
  further left. No size token has 560 or 364, and the grid shares the
  row 3 to 2 (gap: Item overview columns): `file preview` w -5.6,
  `preview bar` w -5.6, `rendered markdown` w -5.6, `side` x -5.6
  w +5.6, `used in workflows` x -5.6 w +5.6, `files` x -5.6 y -5,
  `file · writing-reviewer.md` x -5.6 (gap: Item file summary).
- **Description width.** The description is 948 px wide, the content
  width, against Figma's 940 (`433:525` w +8): Figma's text box ends at
  its longest line, and the render's paragraph fills its column. The two
  lines break at the same word.
- **All chip.** The render draws All as the selected chip, because the
  filter is All; Figma D7 draws no chip selected, as D3 and D4 do. The
  app keeps one rule for every frame: the chip of the current filter is
  selected.
- **Buttons, copy button, preview bar.** As in D3 and D4: Discuss and
  Show on map are both 32 px high against Figma's 34 and 36 (gap: Item
  action buttons); the copy icon is a plain button with `CopyIcon` (gap:
  Path badge copy button); the preview box and bar are drawn by the library's `FileFrame`, with a 16 px file icon against 14 (gap: File preview).
  The three pass the position check.
- **Selected tab.** `ItemTabs tone="accent"` (library #126, beta.21)
  draws Overview's label cyan, as Figma's. The outline stays
  `border.selected` at half alpha where Figma's is solid cyan (no solid
  selected token, d-050).
- **Other tabs.** How it works, Files, Links, Evals and Activity show
  empty panels: they are later frames (D8, D9).
- **Rail Artifacts icon.** Figma draws `icon/artifacts` at 20 px (433:141)
  where the other rail icons are 22; the shared AppRail draws every item's
  icon at 24 (d-100), so the render's icon is 24 and `exceptions.json`
  names 433:141 (bridge-coord's shared decision, 2026-11-19).
- **Rail Toolkit icon.** Figma draws `icon/toolkit` at 20 px (433:146)
  where the other rail icons are 22; the shared AppRail draws every item's
  icon at 24 (d-100), so the render's icon is 24 and `exceptions.json`
  names 433:146, as for `icon/artifacts`.

## Second review

- **Row counts.** In each Agents row the counts sit level with the name,
  where Figma centres them on the row. `ListRow` puts its trailing part at
  the top of the row, as in D3 and D4 (gap: Toolkit row (pane)).
