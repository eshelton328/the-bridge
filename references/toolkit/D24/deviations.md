# D24 deviations

What still differs from Figma after the fidelity loop (`pnpm fidelity
toolkit D24`, 2026-11-18, against library 1.0.0-beta.36: a first run and
two fix rounds), each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/hookActivity.ts`: D9's data, with
commit-msg open on its Activity tab. Every other Toolkit frame (the 86
frames built before the Activity tab) gives the same text, position and
rule results as before it, layer by layer. The frame's `exceptions.json`
excepts the strings and the `hiddenOverflow` findings below, each with
the entry that records it; with them the text and rules checks now pass.

## Checks

From `pnpm fidelity toolkit` on 2026-11-18, after the list rows moved to
`ListRow padding="pane"` and the pane's kind chips to `FilterChips
fade="none"` (library 1.0.0-beta.65), with the frame's
`exceptions.json`.

- Text: pass. `exceptions.json` excepts 2 Figma strings (`Workflows`,
  `2`); each is explained below.
- Position: 37 of 47 layers pass. The 10 that fail: `group · WORKFLOWS`
  y -5; `activity` h +10; `row · day and where` h -5; `panel · by day` h
  -5; `panel · where` h -5; `panel · chats` y -8, h +19; `row · Commit
  and push private brain` y -9, h +11; `row · Deep research on evals` y
  -6, h +11; `row · Writer rules, skills, and agents` h +11; `row ·
  Agent PR description toolkit pieces` h +11. Each is explained below.
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
  tolerance: `group · WORKFLOWS` y -5. With the shorter rows the last
  rows' text (`hooks/commit-msg`, `→1 ←1`, `commit-msg`) lies above the
  frame's foot and is visible, so its exceptions are gone. The list no
  longer runs past the frame's foot, so the pane does not scroll on its
  own and its `hiddenOverflow` exception on `[data-figma="toolkit
  list"]` is gone.
- **List pane.** The kind chips are wider than the list pane and scroll
  sideways (`[data-figma="filter · chips"] > div.filter-chips__root`);
  Figma cuts the Workflows chip at the same edge, so `Workflows` and `2`
  are not visible in either. `FilterChips fade="none"` (library
  1.0.0-beta.65) draws the cut chip at full strength up to the pane's
  edge, as Figma does; before, it faded out over 24 px.
- **Key figures.** The four figures are the library's `KpiTile`, which
  pads 10 and 12 inside a 1 px border with 16 px lines (d-072), where
  Figma pads 11 and 13 with 17 px lines, so each tile is 3 px shorter
  (86 against 89; every `panel · kpi` key is within the tolerance) and
  the panels under them start 3 px higher (gap: KPI tile).
  Each value is as high as Figma's (the `title` style, 20 px), but
  `KpiTile` draws it with tabular figures, so a value with a 1 draws 2
  to 4 px wider than Figma's proportional figures (on M23 `18` is 23 px
  against 21, `Nov 14` 66 against 62) and looks a size larger; the tile
  has no prop for proportional figures or a smaller value (gap: KPI
  tile).
- **Bar panels.** Each bar panel is the library's `Panel` with its title
  in capitals and its note at the header's end, over the library's
  `HorizontalBarChart`. Its rows are 24 px apart against Figma's 25,
  since the `small` style's line is 16 px high (d-072), so each panel is
  4 to 6 px shorter. The chart sizes its label column to the panel's
  longest label, where Figma gives every label 150 px (on every panel),
  so the two panels' bars start at different x, and the longest bar
  fills its track up to the count, where Figma's is 240 px long; the
  chart takes no label width or bar room (gap: Activity bar chart). `row
  · day and where` y -3 h -5; `panel · by day` y -3 h -5; `panel ·
  where` y -3 h -5.
- **List rows.** Each row is the library's `ListRow`, 62 px high against
  Figma's 51: it pads 10 inside a 1 px border, draws its meta 4 under
  the title in the `mono` style (Figma: the `small` sans style, 2 under
  it) and sets the chat icon and the chevron at its top, where Figma
  centres them; the icons are 16 px against Figma's 15 and 14. So each
  row is h +11, the panel is taller, the rows after the first drift down
  from the panel's higher start and the tab (`activity`) ends lower by
  what the rows add (gap: Activity chat row). `activity` h +10; `panel ·
  chats` y -8 h +19; `row · Commit and push private brain` y -9 h +11;
  `row · Deep research on evals` y -6 h +11; `row · Writer rules,
  skills, and agents` y -3 h +11; `row · Agent PR description toolkit
  pieces` h +11.
  The row's content also starts 11 px right of the panel's title, and
  its chevron ends 11 px left of the end of the header's note (12 to 13
  px with the larger icons), where Figma's row has no side padding and
  its icon, or a round's title, lines up with the title and its chevron
  with the note. The rows sit straight in the `Panel` body, which adds
  no padding, so each row box starts at the panel title's edge; the
  inset is `ListRow`'s 10 px padding inside its 1 px border (gap:
  Activity chat row).
- **Chat taps.** Figma's note says each chat opens as in D18, the chat
  panel of the Activity view. No state draws the Activity view or D18
  yet, so a chat row is not a button: it takes no tap and no focus, and
  its chevron is decorative (`rowTap`). The row gets its tap when D18 is
  built.
