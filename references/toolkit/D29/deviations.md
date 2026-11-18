# D29 deviations

What still differs from Figma after the first run of the fidelity loop
(`pnpm fidelity toolkit D29 D19 D03 D06 D07 D08 D09 D10 D13 D14 D33`,
2026-11-18, against the installed library 1.0.0-beta.31), each with its
reason. The library gaps are in `web/src/pages/toolkit/LIBRARY_GAPS.md`.
The state is `web/src/pages/toolkit/states/ruleLinks.ts`: D37's data (D4's
rule with the Rules, Workflows and Hooks groups), with the rule skills open
on its Links tab. D19, D03, D06, D07, D08, D09, D10, D13, D14 and D33 give
the same results as before D29 (each report's text, position and rule
results are unchanged). The frame has no `exceptions.json`.

## Checks

- Text: fail. All Figma strings are in the render, nothing extra shows,
  and no text is covered by another element. Five strings are not visible,
  all in the list pane, which D37 and D33 share:
  - `Workflows` and `2` (493:473, 493:474), the Workflows chip, which the
    chip row cuts at the list pane's edge, as Figma does (see Kind chips).
  - `commit-msg`, `hooks/commit-msg` and `→1 ←1` (493:603, 493:604,
    493:606): the taller list rows push the Hooks group's row past the
    frame's bottom edge (see Row height).
- Position: 27 of 40 layers pass, among them every layer of the Links
  tab: `links`, `links header`, `links graph`, `row · in and out`,
  `panel · linked from`, `panel · links to` and
  `link · eval-cases · skills.md:72`; and `toolkit list`, `header`,
  `read-only`, `filter · chips`, `search`, `group · RULES`,
  `toolkit item`, `meta row`, `kind badge`, `button · Discuss`,
  `button · Show on map`, `493:626` (the title skills), `path row`,
  `path badge` and the rail's items. The tab fits the frame, so the item
  pane does not scroll.
- Rules: fail. Two `hiddenOverflow` findings: the list pane scrolls on its
  own (`[data-figma="toolkit list"]`), and the kind chips scroll sideways
  (`[data-figma="filter · chips"] > div.filter-chips__root`). D03 has both
  in its `exceptions.json`; this frame takes no exceptions.

## Deviations

- **Row height.** Each list row is 62 px high against Figma's 53
  (`h +9` on every row key; the selected row `h +7`), as on D37 and D33:
  `ListRow` pads 10 inside a 1 px border (gap: Toolkit row (pane)). The
  first row starts within the tolerance and each row after it 9 px lower
  again: `toolkit row · commits-and-prs` h +9;
  `toolkit row · diagrams` y +12; `toolkit row · linear` y +21;
  `toolkit row · readmes` y +30; `toolkit row · releases` y +39;
  `toolkit row · skills` y +48; `toolkit row · ste100` y +55;
  `toolkit row · writing` y +64; `group · WORKFLOWS` y +73;
  `toolkit row · skill-eval-cases` y +76;
  `toolkit row · skill-eval-round` y +85; `group · HOOKS` y +94;
  `toolkit row · commit-msg` y +97.
- **Kind chips.** The chip row is wider than the list pane and scrolls
  sideways; Figma cuts the Workflows chip at the same edge, so `Workflows`
  and `2` are not visible in either.
- **Graph's open item.** skills in the middle of the graph is 180 × 32
  with its name in mono, as eval-cases is, against Figma's 150 × 40 with
  a larger icon and its name in the label style; its line is 30 px
  shorter. `MapGraph` takes one size for every node (gap: Links graph).
- **Line end.** The line from skills to eval-cases ends in a small dot;
  Figma's ends at the node's edge (gap: Links graph).
- **Empty column.** The reason in the graph's left column (No item links
  here. It loads by its paths.) is text laid over `MapGraph`, which has no
  text for an empty column (gap: Links graph). It sits where Figma puts
  it.
- **Node borders.** Each item at a side of the graph and at the start of
  each link row has a border in the full colour of its kind (cyan for a
  skill, violet for an agent, amber for a rule, green for a workflow).
  Figma draws the same colour at about 60 % alpha in the graph and 45 %
  in the rows, so its borders look muted; the icons are full colour in
  both. `MapNode` has no state for a muted kind border and no token has
  a kind colour at part alpha (gap: Links graph, Links panel rows).
- **Link node.** eval-cases in the Links to panel is a `MapNode` 28 px
  high against Figma's 29, a few px wider, and its file and line
  (`skills.md:72`) is a plain mono button in the accent colour (gap:
  Links panel rows). The row passes the position check.
- **Buttons.** Discuss and Show on map are both 32 px high, against
  Figma's 34 and 36, as on D4 (gap: Item action buttons). Both pass the
  position check.
- **Copy button.** The path badge's copy icon is a plain button with the
  library's `CopyIcon`, as on D4 (gap: Path badge copy button).
