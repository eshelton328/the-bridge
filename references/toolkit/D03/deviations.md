# D03 deviations

What still differs from Figma after round 3 of the fidelity loop
(`pnpm fidelity toolkit D01 T01 M01 M04 D02 T02 M11 D03`, 2026-11-17,
against the installed library 1.0.0-beta.10), each with its reason. The
library gaps are in `web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/skillOpen.ts`: the list has T1's data
(writing-reviewer at →3 ←4, as in 427:249), with writer open beside it.
The other seven frames give the same results as before D03. The
numbers below are from the run with library 1.0.0-beta.15 and
`FilterChips padding="none"`, which library #115 added. The Checks below
are from a rerun with library 1.0.0-beta.25 and the item tabs' `tone`
and `density` props (2026-11-17).

## Checks

From `pnpm fidelity toolkit` on 2026-11-18, after the list rows moved to
`ListRow padding="pane"` and the pane's kind chips to `FilterChips
fade="none"` (library 1.0.0-beta.65), with the frame's
`exceptions.json`.

- Text: pass. `exceptions.json` excepts 2 Figma strings (`Workflows`,
  `2`); each is explained below.
- Position: 29 of 59 layers pass. 9 are excepted in `exceptions.json`
  (`group · RULES`, `toolkit row · commits-and-prs`, `toolkit row ·
  diagrams`, `toolkit row · linear`, `toolkit row · readmes`, `toolkit
  row · releases`, `toolkit row · skills`, `toolkit row · ste100`,
  `toolkit row · writing`). The 21 that fail: `group · AGENTS` y -8;
  `toolkit row · diagram-reviewer` y -5; `toolkit row ·
  eval-case-writer` y -6; `toolkit row · eval-grader` y -7; `toolkit row
  · pr-description-checker` y -8; `toolkit row · readme-cold-reader` y
  -9; `toolkit row · writing-reviewer` y -11; `427:271` w +8; `file
  preview` w -5.6; `preview bar` w -5.6; `rendered markdown` w -5.6;
  `side` x -5.6, w +5.6; `used in workflows` x -5.6, w +5.6; `files` x
  -5.6, w -10.8; `file · SKILL.md` x -5.6; `file · references/` x -5.6;
  `file · artifact.md chat.md doc.md` x -5.6, w -12.2; `file ·
  examples.md prd.md ticket.md` x -5.6, w -11.8; `file · scripts/` x
  -5.6; `file · check ste-dict ste-stop-hook test-check` x -5.6, w
  -10.8; `evals link` x -5.6, w +5.6. Each is explained below.
- Rules: pass. 2 findings are excepted in `exceptions.json`:
  `hiddenOverflow` on `[data-figma="toolkit list"]`; `hiddenOverflow` on
  `[data-figma="filter · chips"] > div.filter-chips__root`.

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
  tolerance: `group · AGENTS` y -8; `toolkit row · diagram-reviewer` y
  -5; `toolkit row · eval-case-writer` y -6; `toolkit row · eval-grader`
  y -7; `toolkit row · pr-description-checker` y -8; `toolkit row ·
  readme-cold-reader` y -9; `toolkit row · writing-reviewer` y -11. With
  the shorter rows the last rows' text (`agents/eval-case-writer.md`,
  `eval-grader`, `agents/eval-grader.md`, `→0 ←2`) lies above the
  frame's foot and is visible, so its exceptions are gone. The list
  still runs past the frame's foot, so the pane scrolls on its own
  (`hiddenOverflow` on `[data-figma="toolkit list"]`, in
  `exceptions.json`). The selected writer row and the skill writer have
  no `data-figma`: the agent writer shares the layer name `toolkit row ·
  writer`.
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
- **Selected tab.** `ItemTabs tone="accent"` (library #126, beta.21)
  draws Overview's label cyan, as Figma's. The outline stays
  `border.selected` at half alpha where Figma's is solid cyan (no solid
  selected token, d-050).
- **Other tabs.** How it works, Files, Links, Evals and Activity show
  empty panels: they are later frames (D4, D7 to D9).
- **Rail Artifacts icon.** Figma draws `icon/artifacts` at 20 px (427:38)
  where the other rail icons are 22; the shared AppRail draws every item's
  icon at 24 (d-100), so the render's icon is 24 and `exceptions.json`
  names 427:38 (bridge-coord's shared decision, 2026-11-19).
- **Rail Toolkit icon.** Figma draws `icon/toolkit` at 20 px (427:43)
  where the other rail icons are 22; the shared AppRail draws every item's
  icon at 24 (d-100), so the render's icon is 24 and `exceptions.json`
  names 427:43, as for `icon/artifacts`.

## Second review

- **All chip.** The render draws All as the selected chip, because the
  filter is All; Figma D3 draws no chip selected, where D1 and T1 draw
  All selected. The app keeps one rule for every frame: the chip of the
  current filter is selected.
- **Preview line breaks.** The narrower preview (554 against 560 px)
  breaks the intro paragraph one word earlier on each line (gap: Item
  overview columns).
- **Skill evals chevron.** Fixed: `ListRow trailingAlign="center"`
  centres it down the box, as Figma does (it sat level with the title,
  about 10 px above the box's centre).

## Settings gear (d-119)

In the app, the rail has a Settings gear before More, which this frame
does not draw: Settings has no Figma page, and decision d-119 puts its
entry in the rail (`web/src/blocks/AppRail.tsx`). The Notifications
switch that d-118 put at the rail's end moved to the Settings page, so
the rail no longer draws it.
