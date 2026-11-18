# D30 deviations

What still differs from Figma after the first run of the fidelity loop
(`pnpm fidelity toolkit D30 D29 D19 D03 D06 D07 D08 D09 D10 D13 D14 D33`,
2026-11-18, against the installed library 1.0.0-beta.31), each with its
reason. The library gaps are in `web/src/pages/toolkit/LIBRARY_GAPS.md`.
The state is `web/src/pages/toolkit/states/agentLinks.ts`: D7's data (the
Skills and Agents groups, Skills closed), with the agent writing-reviewer
open on its Links tab. D29, D19, D03, D06, D07, D08, D09, D10, D13, D14 and
D33 give the same results as before D30 (each report's text, position and
rule results are unchanged). The frame has no `exceptions.json`.

The last fidelity run (`pnpm fidelity toolkit`, every Toolkit frame,
2026-11-18) used the installed library 1.0.0-beta.42, with the graph's
open item 150 × 40 at Figma's place and, on the phone, the open item's
lines drawn upright and the open item selected. Text fails, 34 of 40
position layers pass and the rules fail. Against the same run on main
(24fc7be), the position and rule results, failing keys and findings are
the same. The text result is new: the check now also finds
`writing-reviewer` (493:1502) not visible, the open item's name, which
the 150 × 40 node cuts with an ellipsis.

## Checks

- Text: fail. All Figma strings are in the render, nothing extra shows,
  and no text is covered by another element. Three strings are not visible:
  `Workflows` and `2` (493:1095, 493:1096), the Workflows chip, which the
  chip row cuts at the list pane's edge, as Figma does (see Kind chips).
  And `writing-reviewer` (493:1502), the graph's open item, which the
  150 px node cuts with an ellipsis (see Graph's open item).
- Position: 34 of 40 layers pass, among them every layer of the Links
  tab: `links`, `links header`, `links graph`, `row · in and out`,
  `panel · linked from`, `panel · links to` and all seven link rows
  (`link · writer · skills/writer/SKILL.md:107` to
  `link · ste100 · writing-reviewer.md:102`); and `toolkit list`,
  `header`, `read-only`, `filter · chips`, `search`, `group · SKILLS`,
  `group · AGENTS`, `toolkit item`, `meta row`, `kind badge`,
  `button · Discuss`, `button · Show on map`, `493:1201` (the title
  writing-reviewer), `path row`, `path badge` and the rail's items. The
  tab fits the frame, so the item pane does not scroll.
- Rules: fail. One `hiddenOverflow` finding: the kind chips scroll
  sideways (`[data-figma="filter · chips"] > div.filter-chips__root`).
  D03 has it in its `exceptions.json`; this frame takes no exceptions.

## Deviations

- **Row height.** Each list row is 62 px high against Figma's 53
  (`h +9` on every row key; the selected row `h +7`), as on D7: `ListRow`
  pads 10 inside a 1 px border (gap: Toolkit row (pane)). Each row after
  the first agent row is 9 px lower again:
  `toolkit row · diagram-reviewer` y +6;
  `toolkit row · eval-case-writer` y +15;
  `toolkit row · eval-grader` y +24;
  `toolkit row · pr-description-checker` y +33;
  `toolkit row · readme-cold-reader` y +42;
  `toolkit row · writing-reviewer` y +60.
- **Kind chips.** The chip row is wider than the list pane and scrolls
  sideways; Figma cuts the Workflows chip at the same edge, so `Workflows`
  and `2` are not visible in either.
- **Graph's open item.** writing-reviewer in the middle of the graph is
  150 × 40 with its name in the label style, at Figma's place, as
  Figma's (library beta.39 node `size` and `labelStyle: 'label'`, #151).
  Its icon is 16 px against Figma's 15 and sits 8 from the name against
  Figma's 6: `MapNode` takes no icon size or gap (gap: Links graph). So
  the name does not fit: Figma's `writing-reviewer` is 108 px wide in
  the 150 px node, and the library's label style leaves it 104 (a 1 px
  border and 10 px padding at each side, the 16 px icon and the 8 px
  gap), so the name ends in an ellipsis and the text check reports
  `writing-reviewer` (493:1502) as not visible. A width of the bridge's
  own would be a raw value, so the node keeps Figma's 150.
- **Node borders.** Since library beta.39 (#151) each item at a side of
  the graph has its kind's colour at 60 % alpha (`MapGraph
  nodeTone="muted"`, `kindBorder.*`) and each link row's node at 45 %
  (`MapNode tone="faint"`, `kindBorderFaint.*`), with the icons in the
  full kind colour, as in Figma. The icons are 16 px against Figma's 13:
  `MapNode` takes no icon size (gap: Links graph, Links panel rows).
- **Link nodes.** The item at the start of each link row is a `MapNode`
  28 px high against Figma's 29 and a few px wider, and the file and line
  at the row's end is a plain mono button in the accent colour (gap: Links
  panel rows). Every row passes the position check.
- **Buttons.** Discuss and Show on map are both 32 px high, against
  Figma's 34 and 36, as on D7 (gap: Item action buttons). Both pass the
  position check.
- **Copy button.** The path badge's copy icon is a plain button with the
  library's `CopyIcon`, as on D7 (gap: Path badge copy button).
