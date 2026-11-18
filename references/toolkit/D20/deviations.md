# D20 deviations

What still differs from Figma after the fidelity loop
(`pnpm fidelity toolkit D20`, 2026-11-18, against library 1.0.0-beta.36:
a first run and three fix rounds), each with its reason. The library
gaps are in `web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/skillEvals.ts`: D3's data (the list has
T1's data), with writer open on its Evals tab. Every other Toolkit frame
(D03, D04, D06 to D10, D13, D14, D19 and D29 to D39 and the list frames)
gives the same text, position and rule results as before the Evals tab.
The frame has no `exceptions.json`.

## Checks

- Text: fail. Every Figma string is in the render and nothing extra
  shows. 6 strings are not visible: `Workflows` (482:1536), `2`
  (482:1537), `agents/eval-case-writer.md` (482:1651), `eval-grader`
  (482:1660), `agents/eval-grader.md` (482:1661), `→0 ←2` (482:1663);
  see List pane.
- Position: 39 of 66 layers pass. The 27 that fail:
  `toolkit row · agents-md` y +3 h +9; `toolkit row · ambitious` y +12 h
  +9; `toolkit row · audit-slop` y +21 h +9; `toolkit row · eval-cases`
  y +30 h +9; `toolkit row · mermaid-diagrams` y +39 h +9;
  `toolkit row · pr-description` y +48 h +9;
  `toolkit row · project-setup` y +57 h +9; `toolkit row · readme` y +66
  h +9; `group · AGENTS` y +82 w -0.7 h +3;
  `toolkit row · diagram-reviewer` y +85 h +9;
  `toolkit row · eval-case-writer` y +94 h +9;
  `toolkit row · eval-grader` y +103 h +9;
  `toolkit row · pr-description-checker` y +112 h +9;
  `toolkit row · readme-cold-reader` y +121 h +9;
  `toolkit row · writing-reviewer` y +139 h +9; `group · RULES` noLayer;
  `toolkit row · commits-and-prs` noLayer; `toolkit row · diagrams`
  noLayer; `toolkit row · linear` noLayer; `toolkit row · readmes`
  noLayer; `toolkit row · releases` noLayer; `toolkit row · skills`
  noLayer; `toolkit row · ste100` noLayer; `toolkit row · writing`
  noLayer; `evals` h -5; `badge · D6` x +1 y -1 w -7.6 h -1; `chart` y
  -2 h +25. Each is explained below.
- Rules: fail. 2 `hiddenOverflow` findings:
  `[data-figma="toolkit list"]`;
  `[data-figma="filter · chips"] > div.filter-chips__root`. Each is
  explained below; this frame takes no exceptions.

## Deviations

- **Row height.** Each list row is 62 px high against Figma's 53 (h +9),
  as on D3 and D4: `ListRow` pads 10 inside a 1 px border (gap: Toolkit
  row (pane)). Each row after the first starts 9 px lower again, and the
  group headers 3 px taller: `toolkit row · agents-md` y +3 h +9;
  `toolkit row · ambitious` y +12 h +9; `toolkit row · audit-slop` y +21
  h +9; `toolkit row · eval-cases` y +30 h +9;
  `toolkit row · mermaid-diagrams` y +39 h +9;
  `toolkit row · pr-description` y +48 h +9;
  `toolkit row · project-setup` y +57 h +9; `toolkit row · readme` y +66
  h +9; `group · AGENTS` y +82 w -0.7 h +3;
  `toolkit row · diagram-reviewer` y +85 h +9;
  `toolkit row · eval-case-writer` y +94 h +9;
  `toolkit row · eval-grader` y +103 h +9;
  `toolkit row · pr-description-checker` y +112 h +9;
  `toolkit row · readme-cold-reader` y +121 h +9;
  `toolkit row · writing-reviewer` y +139 h +9. The last rows lie past
  the frame's foot, so their text is not visible (the List pane strings
  above).
- **Rules group.** The list has T1's data, so the Rules group lies below
  the frame: `group · RULES`, `toolkit row · commits-and-prs`,
  `toolkit row · diagrams`, `toolkit row · linear`,
  `toolkit row · readmes`, `toolkit row · releases`,
  `toolkit row · skills`, `toolkit row · ste100`,
  `toolkit row · writing` have no layer in the frame (`noLayer`), as on
  D19.
- **List pane.** The kind chips are wider than the list pane and scroll
  sideways (`[data-figma="filter · chips"] > div.filter-chips__root`);
  Figma cuts the Workflows chip at the same edge, so `Workflows` and `2`
  are not visible in either. The list pane scrolls on its own
  (`[data-figma="toolkit list"]`) because its rows are taller (Row
  height). D3, D4 and D19 have the same findings.
- **Line heights.** The tab's headers, its small and mono lines and its
  rows are 16 px high in the `monoCaps`, `small` and `mono` text styles
  against Figma's 17: the library keeps line heights on the 4 px grid
  (d-072). The rows sit 8 and 10 apart in turn to keep Figma's 25 and 47
  px steps on average, and the lines under the badges, the chart and the
  cases 2 px lower, so most rows stay within the tolerance; what remains
  adds up down the tab: `evals` h -5 (gap: Evals panels).
- **Chart size.** The chart's box is 392 × 135 against Figma's 392 × 110
  (`chart` y -2 h +25): `GroupedBarChart` draws its axis inside its own
  SVG, where Figma's `chart` layer is the plot and `axis` (482:1947) a
  row under it. The bars, their 56 px pitch and the axis labels sit
  where Figma's do (gap: Evals bar chart).
- **Badges.** The criteria are the library's `Badge size="sm"`, each 2
  px wider than Figma's, so they sit 4 apart against Figma's 6 and each
  stays at Figma's x. The checks and the cross are the library's 12 px
  `CheckIcon` and `CloseCircleIcon` against Figma's 11. The waiting
  criterion D6 Real use · waits has its label in the badge's one style,
  112 × 20, where Figma draws it in a larger style, 120 × 21
  (`badge · D6` x +1 y -1 w -7.6 h -1; gap: Evals criterion badge).
- **Open the ledger.** Figma draws Open the ledger in the accent colour.
  The ledger is in projects/skill-evals/, outside the toolkit, and no
  frame draws it, so the render keeps the link disabled and muted, with
  a title that says so (gap: Evals panels).
- **D5 Reviewer.** The badge opens the agent writing-reviewer on its
  Evals tab (D26; T25 on a tablet). `Badge` takes no press, so it sits
  in a plain button styled with tokens, which draws nothing of its own
  (gap: Evals panels).
