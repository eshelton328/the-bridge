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

The last fidelity run (`pnpm fidelity toolkit`, every Toolkit frame,
2026-11-18) used the installed library 1.0.0-beta.42, with the graph's
open item 150 × 40 at Figma's place and, on the phone, the open item's
lines drawn upright and the open item selected. Text fails, 27 of 40
position layers pass and the rules fail. Against the same run on main
(24fc7be), the position and rule results, failing keys and findings are
the same.

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
- **Graph's open item.** skills in the middle of the graph is 150 × 40
  with its name in the label style, at Figma's place, as Figma's
  (library beta.39 node `size` and `labelStyle: 'label'`, #151). Its
  icon is 16 px against Figma's 15 and sits 8 from the name against
  Figma's 6: `MapNode` takes no icon size or gap (gap: Links graph).
- **Line end.** The line from skills to eval-cases ends in a small dot;
  Figma's ends at the node's edge (gap: Links graph).
- **Empty column.** The reason in the graph's left column (No item links
  here. It loads by its paths.) is text laid over `MapGraph`, which has no
  text for an empty column (gap: Links graph). It sits where Figma puts
  it.
- **Node borders.** Since library beta.39 (#151) each item at a side of
  the graph has its kind's colour at 60 % alpha (`MapGraph
  nodeTone="muted"`, `kindBorder.*`) and each link row's node at 45 %
  (`MapNode tone="faint"`, `kindBorderFaint.*`), with the icons in the
  full kind colour, as in Figma. The icons are 16 px against Figma's 13:
  `MapNode` takes no icon size (gap: Links graph, Links panel rows).
- **Link node.** eval-cases in the Links to panel is a `MapNode` 28 px
  high against Figma's 29, a few px wider, and its file and line
  (`skills.md:72`) is a plain mono button in the accent colour (gap:
  Links panel rows). The row passes the position check.
- **Buttons.** Discuss and Show on map are both 32 px high, against
  Figma's 34 and 36, as on D4 (gap: Item action buttons). Both pass the
  position check.
- **Copy button.** The path badge's copy icon is a plain button with the
  library's `CopyIcon`, as on D4 (gap: Path badge copy button).
