# D21 deviations

What still differs from Figma after the fidelity loop (`pnpm fidelity
toolkit D21`, 2026-11-18, against library 1.0.0-beta.36: a first run and
two fix rounds), each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/ruleActivity.ts`: D37's data (D4's rule
with D9's groups, as D25), with the rule skills open on its Activity
tab. Every other Toolkit frame (the 86 frames built before the Activity
tab) gives the same text, position and rule results as before it, layer
by layer. The frame's `exceptions.json` excepts the strings and the
`hiddenOverflow` findings below, each with the entry that records it;
with them the text and rules checks now pass.

## Checks

- Text: fail. Every Figma string is in the render. 5 strings are not
  visible: `Workflows` (491:4414), `2` (491:4415), `commit-msg`
  (491:4544), `hooks/commit-msg` (491:4545), `→1 ←1` (491:4547); see
  List pane.
- Position: 25 of 47 layers pass. The 22 that fail: `toolkit row ·
  commits-and-prs` y +3 h +9; `toolkit row · diagrams` y +12 h +9;
  `toolkit row · linear` y +21 h +9; `toolkit row · readmes` y +30 h +9;
  `toolkit row · releases` y +39 h +9; `toolkit row · skills` y +48 h
  +7; `toolkit row · ste100` y +55 h +9; `toolkit row · writing` y +64 h
  +9; `group · WORKFLOWS` y +73 w -0.6 h +3; `toolkit row ·
  skill-eval-cases` y +76 h +9; `toolkit row · skill-eval-round` y +85 h
  +9; `group · HOOKS` y +94 w +0.3 h +3; `toolkit row · commit-msg` y
  +97 h +9; `activity` h +9; `row · day and where` y -3 h -6; `panel ·
  by day` y -3 h -6; `panel · where` y -3 h -5; `panel · chats` y -9 h
  +19; `row · ASD-STE100 writer skill setup` y -10 h +11; `row · README
  effectiveness research and rule` y -7 h +11; `row · Deep research on
  evals` y -4 h +11; `row · Writer rules, skills, and agents` y -1 h
  +11. Each is explained below.
- Rules: fail. 2 `hiddenOverflow` findings: `[data-figma="toolkit
  list"]`; `[data-figma="filter · chips"] > div.filter-chips__root`.
  Each is explained below; the frame's `exceptions.json` excepts them.

## Deviations

- **Row height.** Each list row is 62 px high against Figma's 53 (h +9),
  as on D3, D4 and D20: `ListRow` pads 10 inside a 1 px border (gap:
  Toolkit row (pane)). Each row after the first starts 9 px lower again,
  and the group headers 3 px taller: `toolkit row · commits-and-prs` y
  +3 h +9; `toolkit row · diagrams` y +12 h +9; `toolkit row · linear` y
  +21 h +9; `toolkit row · readmes` y +30 h +9; `toolkit row · releases`
  y +39 h +9; `toolkit row · skills` y +48 h +7; `toolkit row · ste100`
  y +55 h +9; `toolkit row · writing` y +64 h +9; `group · WORKFLOWS` y
  +73 w -0.6 h +3; `toolkit row · skill-eval-cases` y +76 h +9; `toolkit
  row · skill-eval-round` y +85 h +9; `group · HOOKS` y +94 w +0.3 h +3;
  `toolkit row · commit-msg` y +97 h +9. The last rows lie past the
  frame's foot, so their text is not visible (the List pane strings).
- **List pane.** The kind chips are wider than the list pane and scroll
  sideways (`[data-figma="filter · chips"] > div.filter-chips__root`);
  Figma cuts the Workflows chip at the same edge, so `Workflows` and `2`
  are not visible in either. The list pane scrolls on its own
  (`[data-figma="toolkit list"]`) because its rows are taller (Row
  height). Not visible: `Workflows` `2` `commit-msg` `hooks/commit-msg`
  `→1 ←1`. D3, D20 and D25 to D28 have the same findings.
  Figma draws the cut Workflows chip at full strength up to the pane's
  edge; the library's `FilterChips` fades an end that overflows over 24
  px (its `data-overflow-end` mask), so the cut chip fades out (gap:
  Toolkit row (pane)).
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
  · day and where` y -3 h -6; `panel · by day` y -3 h -6; `panel ·
  where` y -3 h -5.
- **List rows.** Each row is the library's `ListRow`, 62 px high against
  Figma's 51: it pads 10 inside a 1 px border, draws its meta 4 under
  the title in the `mono` style (Figma: the `small` sans style, 2 under
  it) and sets the chat icon and the chevron at its top, where Figma
  centres them; the icons are 16 px against Figma's 15 and 14. So each
  row is h +11, the panel is taller, the rows after the first drift down
  from the panel's higher start and the tab (`activity`) ends lower by
  what the rows add (gap: Activity chat row). `activity` h +9; `panel ·
  chats` y -9 h +19; `row · ASD-STE100 writer skill setup` y -10 h +11;
  `row · README effectiveness research and rule` y -7 h +11; `row · Deep
  research on evals` y -4 h +11; `row · Writer rules, skills, and
  agents` y -1 h +11.
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
