# D25 deviations

What still differs from Figma after the fidelity loop
(`pnpm fidelity toolkit D25`, 2026-11-18, against library 1.0.0-beta.36:
a first run and three fix rounds), each with its reason. The library
gaps are in `web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/ruleEvals.ts`: D37's data (D4's list with
D9's groups), with the rule skills open on its Evals tab and D4's skills
in `evalTargets` for the ledgers. Every other Toolkit frame (D03, D04,
D06 to D10, D13, D14, D19 and D29 to D39 and the list frames) gives the
same text, position and rule results as before the Evals tab. The frame
has no `exceptions.json`.

## Checks

- Text: fail. Every Figma string is in the render and nothing extra
  shows. 5 strings are not visible: `Workflows` (492:181), `2`
  (492:182), `commit-msg` (492:311), `hooks/commit-msg` (492:312),
  `→1 ←1` (492:314); see List pane.
- Position: 27 of 40 layers pass. The 13 that fail:
  `toolkit row · commits-and-prs` y +3 h +9; `toolkit row · diagrams` y
  +12 h +9; `toolkit row · linear` y +21 h +9; `toolkit row · readmes` y
  +30 h +9; `toolkit row · releases` y +39 h +9; `toolkit row · skills`
  y +48 h +7; `toolkit row · ste100` y +55 h +9; `toolkit row · writing`
  y +64 h +9; `group · WORKFLOWS` y +73 w -0.6 h +3;
  `toolkit row · skill-eval-cases` y +76 h +9;
  `toolkit row · skill-eval-round` y +85 h +9; `group · HOOKS` y +94 w
  +0.3 h +3; `toolkit row · commit-msg` y +97 h +9. Each is explained
  below.
- Rules: fail. 2 `hiddenOverflow` findings:
  `[data-figma="toolkit list"]`;
  `[data-figma="filter · chips"] > div.filter-chips__root`. Each is
  explained below; this frame takes no exceptions.

## Deviations

- **Row height.** Each list row is 62 px high against Figma's 53 (h +9),
  as on D3 and D4: `ListRow` pads 10 inside a 1 px border (gap: Toolkit
  row (pane)). Each row after the first starts 9 px lower again, and the
  group headers 3 px taller: `toolkit row · commits-and-prs` y +3 h +9;
  `toolkit row · diagrams` y +12 h +9; `toolkit row · linear` y +21 h
  +9; `toolkit row · readmes` y +30 h +9; `toolkit row · releases` y +39
  h +9; `toolkit row · skills` y +48 h +7; `toolkit row · ste100` y +55
  h +9; `toolkit row · writing` y +64 h +9; `group · WORKFLOWS` y +73 w
  -0.6 h +3; `toolkit row · skill-eval-cases` y +76 h +9;
  `toolkit row · skill-eval-round` y +85 h +9; `group · HOOKS` y +94 w
  +0.3 h +3; `toolkit row · commit-msg` y +97 h +9. The last rows lie
  past the frame's foot, so their text is not visible (the List pane
  strings above).
- **List pane.** The kind chips are wider than the list pane and scroll
  sideways (`[data-figma="filter · chips"] > div.filter-chips__root`);
  Figma cuts the Workflows chip at the same edge, so `Workflows` and `2`
  are not visible in either. The list pane scrolls on its own
  (`[data-figma="toolkit list"]`) because its rows are taller (Row
  height). D3, D4 and D19 have the same findings.
- **Ledger rows.** Each ledger's name (writer, ambitious, agents-md,
  readme) is a plain button in the label style that opens the skill:
  writer on its Evals tab (D20), the others on their Overview. The
  library has no round row and no text link at this size, so the rows
  are styled with tokens (gap: Evals panels). The count 4 ledgers is
  accent text with no tap.
- **Item tabs.** Since library #153 (beta.42) only the selected tab has
  a border, so each tab is within 1.1 px of Figma's width and starts
  within 2 px of its x: Overview starts at 526 against Figma's 524 (the
  list pads 2 px in the default density), and Activity ends at 988.3
  against 989. The selected tab, Evals, is 60.9 × 32 against Figma's
  61 × 34, 2 px lower (y 180 against 178), since `ItemTabs`' selected
  tab is as high as the others (32) and no size token is 34 (gap: Item
  tab width).
