# D17 deviations

What still differs from Figma after the fidelity loop (`pnpm fidelity
toolkit D17`, 2026-11-18, against library 1.0.0-beta.36: a first run and
two fix rounds), each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/skillActivity.ts`: D3's data (the list has
T1's data), with writer open on its Activity tab. Every other Toolkit
frame (the 86 frames built before the Activity tab) gives the same text,
position and rule results as before it, layer by layer. The frame has no
`exceptions.json`.

## Checks

- Text: fail. Every Figma string is in the render. 6 strings are not
  visible: `Workflows` (474:225), `2` (474:226),
  `agents/eval-case-writer.md` (474:340), `eval-grader` (474:349),
  `agents/eval-grader.md` (474:350), `→0 ←2` (474:352); see List pane.
- Position: 25 of 57 layers pass. The 32 that fail: `toolkit row ·
  agents-md` y +3 h +9; `toolkit row · ambitious` y +12 h +9; `toolkit
  row · audit-slop` y +21 h +9; `toolkit row · eval-cases` y +30 h +9;
  `toolkit row · mermaid-diagrams` y +39 h +9; `toolkit row ·
  pr-description` y +48 h +9; `toolkit row · project-setup` y +57 h +9;
  `toolkit row · readme` y +66 h +9; `group · AGENTS` y +82 w -0.7 h +3;
  `toolkit row · diagram-reviewer` y +85 h +9; `toolkit row ·
  eval-case-writer` y +94 h +9; `toolkit row · eval-grader` y +103 h +9;
  `toolkit row · pr-description-checker` y +112 h +9; `toolkit row ·
  readme-cold-reader` y +121 h +9; `toolkit row · writing-reviewer` y
  +139 h +9; `group · RULES` noLayer; `toolkit row · commits-and-prs`
  noLayer; `toolkit row · diagrams` noLayer; `toolkit row · linear`
  noLayer; `toolkit row · readmes` noLayer; `toolkit row · releases`
  noLayer; `toolkit row · skills` noLayer; `toolkit row · ste100`
  noLayer; `toolkit row · writing` noLayer; `activity` h +6; `row · day
  and where` y -3 h -6; `panel · by day` y -3 h -5; `panel · where` y -3
  h -6; `panel · chats` y -9 h +16; `row · Linear workflow setup for NCC
  team` y -10 h +11; `row · Brain NC1701 project` y -7 h +11; `row ·
  Deep research on evals` y -4 h +11. Each is explained below.
- Rules: fail. 2 `hiddenOverflow` findings: `[data-figma="toolkit
  list"]`; `[data-figma="filter · chips"] > div.filter-chips__root`.
  Each is explained below; this frame takes no exceptions.

## Deviations

- **Row height.** Each list row is 62 px high against Figma's 53 (h +9),
  as on D3, D4 and D20: `ListRow` pads 10 inside a 1 px border (gap:
  Toolkit row (pane)). Each row after the first starts 9 px lower again,
  and the group headers 3 px taller: `toolkit row · agents-md` y +3 h
  +9; `toolkit row · ambitious` y +12 h +9; `toolkit row · audit-slop` y
  +21 h +9; `toolkit row · eval-cases` y +30 h +9; `toolkit row ·
  mermaid-diagrams` y +39 h +9; `toolkit row · pr-description` y +48 h
  +9; `toolkit row · project-setup` y +57 h +9; `toolkit row · readme` y
  +66 h +9; `group · AGENTS` y +82 w -0.7 h +3; `toolkit row ·
  diagram-reviewer` y +85 h +9; `toolkit row · eval-case-writer` y +94 h
  +9; `toolkit row · eval-grader` y +103 h +9; `toolkit row ·
  pr-description-checker` y +112 h +9; `toolkit row ·
  readme-cold-reader` y +121 h +9; `toolkit row · writing-reviewer` y
  +139 h +9. The last rows lie past the frame's foot, so their text is
  not visible (the List pane strings).
- **Rules group.** The list has T1's data, so the Rules group lies below
  the frame: `group · RULES`, `toolkit row · commits-and-prs`, `toolkit
  row · diagrams`, `toolkit row · linear`, `toolkit row · readmes`,
  `toolkit row · releases`, `toolkit row · skills`, `toolkit row ·
  ste100`, `toolkit row · writing` have no layer in the frame
  (`noLayer`), as on D19 and D20.
- **List pane.** The kind chips are wider than the list pane and scroll
  sideways (`[data-figma="filter · chips"] > div.filter-chips__root`);
  Figma cuts the Workflows chip at the same edge, so `Workflows` and `2`
  are not visible in either. The list pane scrolls on its own
  (`[data-figma="toolkit list"]`) because its rows are taller (Row
  height). Not visible: `Workflows` `2` `agents/eval-case-writer.md`
  `eval-grader` `agents/eval-grader.md` `→0 ←2`. D3, D20 and D25 to D28
  have the same findings.
- **Key figures.** The four figures are the library's `KpiTile`, which
  pads 10 and 12 inside a 1 px border with 16 px lines (d-072), where
  Figma pads 11 and 13 with 17 px lines, so each tile is 3 px shorter
  (86 against 89; every `panel · kpi` key is within the tolerance) and
  the panels under them start 3 px higher (gap: KPI tile).
- **Bar panels.** Each bar panel is the library's `Panel` with its title
  in capitals and its note at the header's end, over the library's
  `HorizontalBarChart`. Its rows are 24 px apart against Figma's 25,
  since the `small` style's line is 16 px high (d-072), so each panel is
  4 to 6 px shorter. The chart sizes its label column to the panel's
  longest label, where Figma gives every label 150 px (on every panel),
  so the two panels' bars start at different x, and the longest bar
  fills its track up to the count, where Figma's is 240 px long; the
  chart takes no label width or bar room (gap: Activity bar chart). `row
  · day and where` y -3 h -6; `panel · by day` y -3 h -5; `panel ·
  where` y -3 h -6.
- **List rows.** Each row is the library's `ListRow`, 62 px high against
  Figma's 51: it pads 10 inside a 1 px border, draws its meta 4 under
  the title in the `mono` style (Figma: the `small` sans style, 2 under
  it) and sets the chat icon and the chevron at its top, where Figma
  centres them; the icons are 16 px against Figma's 15 and 14. So each
  row is h +11, the panel is taller, the rows after the first drift down
  from the panel's higher start and the tab (`activity`) ends lower by
  what the rows add (gap: Activity chat row). `activity` h +6; `panel ·
  chats` y -9 h +16; `row · Linear workflow setup for NCC team` y -10 h
  +11; `row · Brain NC1701 project` y -7 h +11; `row · Deep research on
  evals` y -4 h +11.
- **Chat taps.** Figma's note says each chat opens as in D18, the chat
  panel of the Activity view. No state draws the Activity view or D18
  yet, so a chat row is not a button: it takes no tap and no focus, and
  its chevron is decorative (`rowTap`). The row gets its tap when D18 is
  built.
