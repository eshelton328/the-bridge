# D28 deviations

What still differs from Figma after the fidelity loop
(`pnpm fidelity toolkit D28`, 2026-11-18, against library 1.0.0-beta.36:
a first run and three fix rounds), each with its reason. The library
gaps are in `web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/hookEvals.ts`: D9's data (D4's list with
only the Rules, Workflows and Hooks groups), with the hook commit-msg
open on its Evals tab. Every other Toolkit frame (D03, D04, D06 to D10,
D13, D14, D19 and D29 to D39 and the list frames) gives the same text,
position and rule results as before the Evals tab. The frame has no
`exceptions.json`.

## Checks

- Text: fail. 1 string is missing: `A hook has no eval cases. Its test script runs fixed messages and the rule’s ✗ and ✓ examples through the hook, so the rule and the hook cannot drift apart.`
  (492:2185): the render draws its ✗ and ✓ as the library's cross and
  check icons, so its text has no glyphs (see Cross mark). Every other
  Figma string is in the render and nothing extra shows. 5 strings are
  not visible: `Workflows` (492:1871), `2`
  (492:1872), `hooks/commit-msg` (492:2002), `→1 ←1` (492:2004),
  `commit-msg` (492:2024); see List pane.
- Position: 31 of 44 layers pass. The 13 that fail:
  `toolkit row · commits-and-prs` y +3 h +9; `toolkit row · diagrams` y
  +12 h +9; `toolkit row · linear` y +21 h +9; `toolkit row · readmes` y
  +30 h +9; `toolkit row · releases` y +39 h +9; `toolkit row · skills`
  y +48 h +9; `toolkit row · ste100` y +57 h +9; `toolkit row · writing`
  y +66 h +9; `group · WORKFLOWS` y +75 w -0.6 h +3;
  `toolkit row · skill-eval-cases` y +78 h +9;
  `toolkit row · skill-eval-round` y +87 h +9; `group · HOOKS` y +96 w
  +0.3 h +3; `toolkit row · commit-msg` y +99 h +7. Each is explained
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
  h +9; `toolkit row · skills` y +48 h +9; `toolkit row · ste100` y +57
  h +9; `toolkit row · writing` y +66 h +9; `group · WORKFLOWS` y +75 w
  -0.6 h +3; `toolkit row · skill-eval-cases` y +78 h +9;
  `toolkit row · skill-eval-round` y +87 h +9; `group · HOOKS` y +96 w
  +0.3 h +3; `toolkit row · commit-msg` y +99 h +7. The last rows lie
  past the frame's foot, so their text is not visible (the List pane
  strings above).
- **List pane.** The kind chips are wider than the list pane and scroll
  sideways (`[data-figma="filter · chips"] > div.filter-chips__root`);
  Figma cuts the Workflows chip at the same edge, so `Workflows` and `2`
  are not visible in either. The list pane scrolls on its own
  (`[data-figma="toolkit list"]`) because its rows are taller (Row
  height). D3, D4 and D19 have the same findings.
- **Test badge.** The badge 43 of 43 pass is the library's
  `Badge size="sm" tone="done"` with `CheckIcon` at 12 px, against
  Figma's 11 px icon. Its stroke is 1 px, where Figma's check is about
  2 px wide, so the render's check is thinner; no icon takes a weight
  (gap: Evals criterion badge).
- **Item tabs.** Since library #153 (beta.42) only the selected tab has
  a border, so each tab is within 1.1 px of Figma's width and starts
  within 2 px of its x: Overview starts at 526 against Figma's 524 (the
  list pads 2 px in the default density), and Activity ends at 988.3
  against 989. The selected tab, Evals, is 60.9 × 32 against Figma's
  61 × 34, 2 px lower (y 180 against 178), since `ItemTabs`' selected
  tab is as high as the others (32) and no size token is 34 (gap: Item
  tab width).
- **Cross mark.** Figma's test line has the ballot cross ✗ (U+2717)
  and the check ✓ (U+2713), the cross slanted. The line now draws them
  as the library's `CloseIcon` and `CheckIcon` (12, the text's size, in
  `fg.muted`, named fail and pass for assistive technology), so the
  marks are upright line icons, and the render's line has no glyphs:
  the text check no longer finds Figma's string with ✗ and ✓ in it
  (a coordinator decision; gap: Symbol glyphs, whose font gap remains
  only for other text).
