# D01 deviations

What still differs from Figma after round 2 of the fidelity loop
(`pnpm fidelity toolkit D01`, 2026-11-17, against the installed library
1.0.0-beta.8), each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The numbers below are from
the run with library 1.0.0-beta.15 and the props that library #115 added:
`ViewSwitch tone="accent"` and `FilterChips padding="none"`.

## Checks

- Text: pass. Eight card descriptions are cut with an ellipsis, as
  Figma cuts them; `exceptions.json` names each layer (425:85, 425:99,
  425:113, 425:142, 425:184, 425:199, 425:235, 425:250).
- Position: 13 of 31 layers pass (`header`, `read-only`,
  `view · List, Map or Activity`, `list tools`, `search`,
  `counts legend`, `group · SKILLS`).
  The shared navigation's items pass too: `rail · Inbox`,
  `rail · Workspaces`, `rail · Projects`, `rail · Artifacts`,
  `rail · Toolkit` and `rail · More`.
- Rules: pass. The `hiddenOverflow` findings on the eight cut
  descriptions are in `exceptions.json`.

## Deviations

- **Card height.** Each card is 124 px high against Figma's 150
  (`h -26` on every card key: `toolkit card · agents-md`,
  `toolkit card · ambitious`, `toolkit card · audit-slop` and
  `toolkit card · eval-cases` in the first row, and the cards below). Figma puts a 14 px spacer
  (425:86) and another 10 px gap between the description and the
  counts; the library `Card` puts the counts 10 px under the
  description (gap: Toolkit card height). The first card row starts
  5 px higher (y -5 on the four first-row cards): the chip row is 2 px
  higher and 2 px shorter than Figma's (see Kind chips), so the search
  and Sort start 4 px higher (within the tolerance), and the SKILLS
  header is 1 px shorter. Each card row after it starts higher by the
  same 26 px, less the 3 px the shorter group header gives back:
  `toolkit card · mermaid-diagrams`, `toolkit card · pr-description`,
  `toolkit card · project-setup` and `toolkit card · readme` y -27;
  `group · AGENTS` y -75; `toolkit card · diagram-reviewer`,
  `toolkit card · eval-case-writer`, `toolkit card · eval-grader` and
  `toolkit card · pr-description-checker` y -76;
  `toolkit card · readme-cold-reader` and
  `toolkit card · writing-reviewer` y -98. The list ends higher too: its
  content is 960 px high, so `toolkit` is h -22 and does not run on past
  the frame's bottom edge as Figma's does.
- **Kind tile.** The card's kind tile is 36 px (`KindTile size="lg"`)
  against Figma's 32; the library has 28 and 36 (gap: Kind tile 32 px).
  The name and path move 2 px down in the title row.
- **View switch.** List, Map and Activity pass the position check, and
  with `tone="accent"` the selected List item has the selected fill with
  no border and a cyan label and icon, as in Figma. The switch is still
  36 px high against Figma's 38, with a 2 px inset against 4 and 16 px
  icons against 15: no control token has 38 (gap: View switch 38 px).
- **Kind chips.** The chip row is 565.8 px wide against Figma's 580 and
  32 high against 34 (`filter · chips` w -14.2). With `padding="none"`
  the row has no inset, as in Figma. The `md` chips are 32 px high with
  10 px sides, where Figma's desktop chips are 34 high and each about
  2 px wider (All is 63 px). No control token has 34 (gap: Kind chip
  row).
- **Sort button.** Name is 116.5 px wide against Figma's 105
  (`button · Sort` w +11.5): `Button size="lg"` has wider sides and gaps
  than Figma's 13 and 6 (gap: Sort button with chevron).
- **Group headers.** SKILLS and AGENTS use `GroupHeader
  variant="sidebar"` (30 px high, Figma 31), as the list variant is 36
  (gap: Toolkit group header). The chevron is the library's 12 px.
- **Search width.** The search and Sort take half the row, so the search
  is 569.5 px wide against Figma's 566 (within the tolerance; gap:
  Toolkit search width).
- **Rules, Workflows and Hooks.** The frame shows only the Skills and
  Agents cards, so the state has no items for the other three kinds;
  their chips show Figma's counts (8, 2 and 1).

## Second review

- The reviewer read a comma after "Read from toolkit/ in the brain" in a
  scaled image; the code and the text check have none.
