# D22 deviations

What still differs from Figma after the fidelity loop (`pnpm fidelity
toolkit D22`, 2026-11-18, against library 1.0.0-beta.36: a first run and
two fix rounds), each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/agentActivity.ts`: D7's data (Skills
closed, the Agents group), with writing-reviewer open on its Activity
tab. Every other Toolkit frame (the 86 frames built before the Activity
tab) gives the same text, position and rule results as before it, layer
by layer. The frame has no `exceptions.json`.

## Checks

- Text: fail. Every Figma string is in the render. 2 strings are not
  visible: `Workflows` (491:4965), `2` (491:4966); see List pane.
- Position: 27 of 41 layers pass. The 14 that fail: `toolkit row ·
  diagram-reviewer` y +6 h +9; `toolkit row · eval-case-writer` y +15 h
  +9; `toolkit row · eval-grader` y +24 h +9; `toolkit row ·
  pr-description-checker` y +33 h +9; `toolkit row · readme-cold-reader`
  y +42 h +9; `toolkit row · writing-reviewer` y +60 h +7; `activity` h
  +9; `row · day and where` y -3 h -6; `panel · by day` y -3 h -6;
  `panel · chats` y -9 h +19; `row · NCC-1701 Figma toolkit page` y -10
  h +11; `row · Brain NC1701 project` y -7 h +11; `row · Writer rules,
  skills, and agents` y -4 h +11; `row · Deep research on evals` y -1 h
  +11. Each is explained below.
- Rules: fail. 1 `hiddenOverflow` finding: `[data-figma="filter ·
  chips"] > div.filter-chips__root`. Each is explained below; this frame
  takes no exceptions.

## Deviations

- **Row height.** Each list row is 62 px high against Figma's 53 (h +9),
  as on D3, D4 and D20: `ListRow` pads 10 inside a 1 px border (gap:
  Toolkit row (pane)). Each row after the first starts 9 px lower again,
  and the group headers 3 px taller: `toolkit row · diagram-reviewer` y
  +6 h +9; `toolkit row · eval-case-writer` y +15 h +9; `toolkit row ·
  eval-grader` y +24 h +9; `toolkit row · pr-description-checker` y +33
  h +9; `toolkit row · readme-cold-reader` y +42 h +9; `toolkit row ·
  writing-reviewer` y +60 h +7. The last rows lie past the frame's foot,
  so their text is not visible (the List pane strings).
- **List pane.** The kind chips are wider than the list pane and scroll
  sideways (`[data-figma="filter · chips"] > div.filter-chips__root`);
  Figma cuts the Workflows chip at the same edge, so `Workflows` and `2`
  are not visible in either. Not visible: `Workflows` `2`. D3, D20 and
  D25 to D28 have the same findings.
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
  · day and where` y -3 h -6; `panel · by day` y -3 h -6.
- **List rows.** Each row is the library's `ListRow`, 62 px high against
  Figma's 51: it pads 10 inside a 1 px border, draws its meta 4 under
  the title in the `mono` style (Figma: the `small` sans style, 2 under
  it) and sets the chat icon and the chevron at its top, where Figma
  centres them; the icons are 16 px against Figma's 15 and 14. So each
  row is h +11, the panel is taller, the rows after the first drift down
  from the panel's higher start and the tab (`activity`) ends lower by
  what the rows add (gap: Activity chat row). `activity` h +9; `panel ·
  chats` y -9 h +19; `row · NCC-1701 Figma toolkit page` y -10 h +11;
  `row · Brain NC1701 project` y -7 h +11; `row · Writer rules, skills,
  and agents` y -4 h +11; `row · Deep research on evals` y -1 h +11.
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
