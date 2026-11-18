# D26 deviations

What still differs from Figma after the fidelity loop
(`pnpm fidelity toolkit D26`, 2026-11-18, against library 1.0.0-beta.36:
a first run and three fix rounds), each with its reason. The library
gaps are in `web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/agentEvals.ts`: D7's data (T1's list with
only the Skills and Agents groups and Skills closed), with the agent
writing-reviewer open on its Evals tab. Every other Toolkit frame (D03,
D04, D06 to D10, D13, D14, D19 and D29 to D39 and the list frames) gives
the same text, position and rule results as before the Evals tab. The
frame has no `exceptions.json`.

## Checks

- Text: fail. Every Figma string is in the render and nothing extra
  shows. 2 strings are not visible: `Workflows` (492:705), `2`
  (492:706); see List pane.
- Position: 38 of 44 layers pass. The 6 that fail:
  `toolkit row · diagram-reviewer` y +6 h +9;
  `toolkit row · eval-case-writer` y +15 h +9;
  `toolkit row · eval-grader` y +24 h +9;
  `toolkit row · pr-description-checker` y +33 h +9;
  `toolkit row · readme-cold-reader` y +42 h +9;
  `toolkit row · writing-reviewer` y +60 h +7. Each is explained below.
- Rules: fail. 1 `hiddenOverflow` finding:
  `[data-figma="filter · chips"] > div.filter-chips__root`. Each is
  explained below; this frame takes no exceptions.

## Deviations

- **Row height.** Each list row is 62 px high against Figma's 53 (h +9),
  as on D3 and D4: `ListRow` pads 10 inside a 1 px border (gap: Toolkit
  row (pane)). Each row after the first starts 9 px lower again, and the
  group headers 3 px taller: `toolkit row · diagram-reviewer` y +6 h +9;
  `toolkit row · eval-case-writer` y +15 h +9;
  `toolkit row · eval-grader` y +24 h +9;
  `toolkit row · pr-description-checker` y +33 h +9;
  `toolkit row · readme-cold-reader` y +42 h +9;
  `toolkit row · writing-reviewer` y +60 h +7. The last rows lie past
  the frame's foot, so their text is not visible (the List pane strings
  above).
- **List pane.** The kind chips are wider than the list pane and scroll
  sideways (`[data-figma="filter · chips"] > div.filter-chips__root`);
  Figma cuts the Workflows chip at the same edge, so `Workflows` and `2`
  are not visible in either. D3 and D19 have the same finding.
- **Open the ledger.** Figma draws Open the ledger in the accent colour.
  The ledger is in projects/skill-evals/, outside the toolkit, and no
  frame draws it, so the render keeps the link disabled and muted, with
  a title that says so (gap: Evals panels).
