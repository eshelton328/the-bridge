# D03 deviations

What still differs from Figma after round 3 of the fidelity loop
(`pnpm fidelity toolkit D01 T01 M01 M04 D02 T02 M11 D03`, 2026-11-17,
against the installed library 1.0.0-beta.10), each with its reason. The
library gaps are in `web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/skillOpen.ts`: the list has T1's data
(writing-reviewer at →3 ←4, as in 427:249), with writer open beside it.
The other seven frames give the same results as before D03. The
numbers below are from the run with library 1.0.0-beta.15 and
`FilterChips padding="none"`, which library #115 added.

## Checks

- Text: fail. Every Figma string is in the render. Four strings are not
  visible, because the taller list rows push them past the frame's
  bottom edge (see Row height): `agents/eval-case-writer.md` (427:197),
  and `eval-grader`, `agents/eval-grader.md` and `→0 ←2` (427:200). The
  Workflows chip's label and count (427:82, 427:83) are in
  `exceptions.json`: Figma cuts them at the list pane's edge too.
- Position: 21 of 59 layers pass (`toolkit list`, `header`, `read-only`,
  `filter · chips`, `search`, `group · SKILLS`, `toolkit item`,
  `meta row`, `kind badge`, `button · Discuss`, `button · Show on map`,
  `427:270`, `path row`, `path badge`, `columns`). The Rules group and
  its eight rows (9 layers) are in `exceptions.json`: the frame has no
  layer for them.
  The shared navigation's items pass too: `rail · Inbox`,
  `rail · Workspaces`, `rail · Projects`, `rail · Artifacts`,
  `rail · Toolkit` and `rail · More`.
- Rules: pass. Two `hiddenOverflow` findings are in `exceptions.json`:
  the list pane scrolls on its own (`[data-figma="toolkit list"]`), and
  the kind chips scroll sideways, cut at the pane's edge as in Figma
  (`[data-figma="filter · chips"] > div.filter-chips__root`).

## Deviations

- **Row height.** Each list row is 62 px high against Figma's 53
  (`h +9` on every row key), and its counts sit level with the name,
  where Figma centres them. `ListRow` pads 10 inside a 1 px border (gap:
  Toolkit row (pane)). The first row starts 3 px lower (within the
  tolerance) and each row after it 9 px lower again:
  `toolkit row · ambitious` y +12; `toolkit row · audit-slop` y +21;
  `toolkit row · eval-cases` y +30; `toolkit row · mermaid-diagrams`
  y +39; `toolkit row · pr-description` y +48;
  `toolkit row · project-setup` y +57; `toolkit row · readme` y +66;
  `group · AGENTS` y +82; `toolkit row · diagram-reviewer` y +85;
  `toolkit row · eval-case-writer` y +94; `toolkit row · eval-grader`
  y +103; `toolkit row · pr-description-checker` y +112;
  `toolkit row · readme-cold-reader` y +121;
  `toolkit row · writing-reviewer` y +139. The selected writer row and
  the skill writer have no `data-figma`: the agent writer shares the
  layer name `toolkit row · writer`.
- **Overview columns.** The preview is 554.4 px wide against Figma's 560
  and the side column 369.6 against 364, so the side starts 5.6 px
  further left. No size token has 560 or 364, and the grid shares the
  row 3 to 2 (gap: Item overview columns): `file preview` w -5.6,
  `preview bar` w -5.6, `rendered markdown` w -5.6, `side` x -5.6
  w +5.6, `used in workflows` x -5.6 w +5.6, `evals link` x -5.6 w +5.6.
- **File lines.** Every line of the files list starts 5.6 px further
  left with the side column, and the lines with several names are about
  11 px narrower: the `mono` glyphs are narrower than Figma's, and the
  names sit 16 px apart where Figma has two spaces (gap: Item file
  summary). `files` x -5.6 w -10.8; `file · SKILL.md` x -5.6;
  `file · references/` x -5.6;
  `file · artifact.md  chat.md  doc.md` x -5.6 w -12.2;
  `file · examples.md  prd.md  ticket.md` x -5.6 w -11.8;
  `file · scripts/` x -5.6;
  `file · check  ste-dict  ste-stop-hook  test-check` x -5.6 w -10.8.
- **Description width.** The description is 948 px wide, the content
  width, against Figma's 940 (`427:271` w +8): Figma's text box ends at
  its longest line, and the render's paragraph fills its column. The
  two lines break at the same word.
- **Buttons.** Discuss and Show on map are both 32 px high, against
  Figma's 34 and 36, because the 36 px button draws Show on map 9 px
  wider than Figma's (gap: Item action buttons). Both pass the position
  check.
- **Copy button.** The copy icon in the path badge is a plain button
  with the library's `CopyIcon`, styled with tokens: the library has no
  button small enough for `PathBadge` (gap: Path badge copy button).
- **File preview bar.** The box and its bar are drawn with the Panel's
  tokens around `MarkdownView`; the file icon is 16 px against Figma's
  14 (gap: File preview).
- **Other tabs.** How it works, Files, Links, Evals and Activity show
  empty panels: they are later frames (D4, D7 to D9).

## Second review

- **All chip.** The render draws All as the selected chip, because the
  filter is All; Figma D3 draws no chip selected, where D1 and T1 draw
  All selected. The app keeps one rule for every frame: the chip of the
  current filter is selected.
- **Preview line breaks.** The narrower preview (554 against 560 px)
  breaks the intro paragraph one word earlier on each line (gap: Item
  overview columns).
- **Skill evals chevron.** It sits level with the title, about 10 px
  above the box's centre (gap: Toolkit row (pane)).
