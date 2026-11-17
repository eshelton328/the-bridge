# D07 deviations

What still differs from Figma after the last round of the fidelity loop
(`pnpm fidelity toolkit D07`, 2026-11-17, against the installed library
1.0.0-beta.15), each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/agentOpen.ts`: T1's list data with only the
Skills and Agents groups, as the frame draws them, the Skills group
closed, and the agent writing-reviewer open beside it. D03 and D04 give
the same results as before D07 (D03: text fail with the same four strings,
15 of 53 layers; D04: text pass, 15 of 49 layers; both rules pass).

## Checks

- Text: pass. In `exceptions.json`: the Workflows chip's label and count
  (433:185, 433:186), which Figma cuts at the list pane's edge too.
- Position: 21 of 36 layers pass (`toolkit list`, `header`, `read-only`,
  `filter · chips`, `search`, `group · SKILLS`, `group · AGENTS`,
  `toolkit item`, `meta row`, `kind badge`, `button · Discuss`,
  `button · Show on map`, `433:524`, `path row`, `path badge`,
  `kind section · agent`, `facts`, `fact · Claude`, `fact · Codex`,
  `fact · Tools`, `fact · Context`). The agent writer's row has no
  `data-figma`: the skill writer (in the closed Skills group) shares the
  layer name `toolkit row · writer`, as in D03.
- Rules: pass. One `hiddenOverflow` finding is in `exceptions.json`, as
  in D03 and D04: the kind chips scroll sideways, cut at the pane's edge
  (`[data-figma="filter · chips"] > div.filter-chips__root`).

## Deviations

- **Row height.** Each list row is 62 px high against Figma's 53 (the
  open row is 62 against 55), and its counts sit level with the name,
  where Figma centres them. `ListRow` pads 10 inside a 1 px border (gap:
  Toolkit row (pane)). The first row starts 6 px lower and each row
  after it 9 px lower again: `toolkit row · diagram-reviewer` y +6 h +9;
  `toolkit row · eval-case-writer` y +15 h +9;
  `toolkit row · eval-grader` y +24 h +9;
  `toolkit row · pr-description-checker` y +33 h +9;
  `toolkit row · readme-cold-reader` y +42 h +9;
  `toolkit row · writing-reviewer` y +60 h +7. The list ends at 722
  against Figma's 655; nothing lies below it, so no text is lost.
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
  Path badge copy button); the preview box and bar are drawn with the
  Panel's tokens, with a 16 px file icon against 14 (gap: File preview).
  The three pass the position check.
- **Other tabs.** How it works, Files, Links, Evals and Activity show
  empty panels: they are later frames (D8, D9).

## Second review

- **Row counts.** In each Agents row the counts sit level with the name,
  where Figma centres them on the row. `ListRow` puts its trailing part at
  the top of the row, as in D3 and D4 (gap: Toolkit row (pane)).
