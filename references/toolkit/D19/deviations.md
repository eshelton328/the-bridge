# D19 deviations

What still differs from Figma after the first run of the fidelity loop
(`pnpm fidelity toolkit D19 D03 D06 D07 D08 D09 D10 D13 D14 D33`,
2026-11-18, against the installed library 1.0.0-beta.31), each with its
reason. The library gaps are in `web/src/pages/toolkit/LIBRARY_GAPS.md`.
The state is `web/src/pages/toolkit/states/skillLinks.ts`: D3's data (the
list has T1's data), with writer open on its Links tab. D03, D06, D07,
D08, D09, D10, D13, D14 and D33 give the same results as before D19 (each
report's text, position and rule results are unchanged). The frame's
`exceptions.json` excepts the strings and the `hiddenOverflow` findings
below, each with the entry that records it; with them the text and rules
checks now pass.

The last fidelity run (`pnpm fidelity toolkit`, every Toolkit frame,
2026-11-18) used the installed library 1.0.0-beta.42, with the graph's
open item 150 × 40 at Figma's place and, on the phone, the open item's
lines drawn upright and the open item selected. Text fails, 36 of 61
position layers pass and the rules fail. Against the same run on main
(24fc7be), the position and rule results, failing keys and findings are
the same.

## Checks

- Text: fail. All 140 Figma strings are in the render, nothing extra
  shows, and no text is covered by another element. Six strings are not
  visible, all in the list pane, which D3 shares:
  - `Workflows` and `2` (482:181, 482:182), the Workflows chip, which the
    chip row cuts at the list pane's edge, as Figma does (see Kind chips).
  - `agents/eval-case-writer.md` (482:296), and `eval-grader`,
    `agents/eval-grader.md` and `→0 ←2` (482:305, 482:306, 482:308): the
    taller list rows push them past the frame's bottom edge (see Row
    height).
- Position: 36 of 61 layers pass, among them every layer of the Links
  tab: `links`, `links header`, `links graph`, `row · in and out`,
  `panel · linked from`, `panel · links to` and all eleven link rows
  (`link · writing · rules/writing.md:77` to
  `link · audit-slop · SKILL.md:118`); and `toolkit list`, `header`,
  `read-only`, `filter · chips`, `search`, `group · SKILLS`, `meta row`,
  `kind badge`, `button · Discuss`, `button · Show on map`, `482:367`
  (the title writer), `path row`, `path badge` and the rail's items. The
  graph's nodes have no `data-figma`: `MapGraph` draws them, and it takes
  no attribute for a node.
- Rules: fail. Three `hiddenOverflow` findings: the list pane scrolls on
  its own (`[data-figma="toolkit list"]`), the kind chips scroll sideways
  (`[data-figma="filter · chips"] > div.filter-chips__root`), and the item
  pane scrolls
  (`div > div.backdrop > div.backdrop > div.app-shell__root > main.app-shell__detail`,
  see Item height). D03 has the first two in its `exceptions.json`; this
  frame's `exceptions.json` excepts all three.

## Deviations

- **Item height.** Figma's Links tab runs past the frame's foot (`links`
  482:539 ends at 1099, its last link and the note under the frame), and
  the frame cuts it. The render keeps the whole tab and scrolls the item
  pane, so `toolkit item` is 136 px taller than Figma's (h +136) and the
  rule check reports the pane's scroll as `hiddenOverflow`. The text
  under the frame's foot is in neither view.
- **Row height.** Each list row is 62 px high against Figma's 53
  (`h +9` on every row key), as on D3: `ListRow` pads 10 inside a 1 px
  border (gap: Toolkit row (pane)). The first row starts within the
  tolerance and each row after it 9 px lower again:
  `toolkit row · agents-md` h +9; `toolkit row · ambitious` y +12;
  `toolkit row · audit-slop` y +21; `toolkit row · eval-cases` y +30;
  `toolkit row · mermaid-diagrams` y +39;
  `toolkit row · pr-description` y +48;
  `toolkit row · project-setup` y +57; `toolkit row · readme` y +66;
  `group · AGENTS` y +82; `toolkit row · diagram-reviewer` y +85;
  `toolkit row · eval-case-writer` y +94;
  `toolkit row · eval-grader` y +103;
  `toolkit row · pr-description-checker` y +112;
  `toolkit row · readme-cold-reader` y +121;
  `toolkit row · writing-reviewer` y +139.
- **Rules group.** The list has T1's data, so the Rules group lies below
  the frame: `group · RULES` and its rows `toolkit row · commits-and-prs`,
  `toolkit row · diagrams`, `toolkit row · linear`,
  `toolkit row · readmes`, `toolkit row · releases`,
  `toolkit row · skills`, `toolkit row · ste100` and
  `toolkit row · writing` have no layer in the frame (`noLayer`). D3 has
  the same rows in its `exceptions.json`.
- **Kind chips.** The chip row is wider than the list pane and scrolls
  sideways; Figma cuts the Workflows chip at the same edge, so `Workflows`
  and `2` are not visible in either.
- **Graph's open item.** writer in the middle of the graph is 150 × 40
  with its name in the label style, at Figma's place, as Figma's
  (library beta.39 node `size` and `labelStyle: 'label'`, #151). Its
  icon is 16 px against Figma's 15 and sits 8 from the name against
  Figma's 6: `MapNode` takes no icon size or gap (gap: Links graph).
- **Node borders.** Since library beta.39 (#151) each item at a side of
  the graph has its kind's colour at 60 % alpha (`MapGraph
  nodeTone="muted"`, `kindBorder.*`) and each link row's node at 45 %
  (`MapNode tone="faint"`, `kindBorderFaint.*`), with the icons in the
  full kind colour, as in Figma. The icons are 16 px against Figma's 13:
  `MapNode` takes no icon size (gap: Links graph, Links panel rows).
- **Link nodes.** The item at the start of each link row is a `MapNode`
  28 px high against Figma's 29, with a 16 px icon 8 from the name, where
  Figma draws 13 px and 6, so each node is about 5 px wider. The row
  keeps Figma's 50 px height, and every row passes (gap: Links panel
  rows).
- **File and line.** The file and line at each link row's end (such as
  `rules/writing.md:77`) is a plain button in the accent colour in mono,
  styled with tokens: the library has no text link in mono (gap: Links
  panel rows).
- **Buttons.** Discuss and Show on map are both 32 px high, against
  Figma's 34 and 36, as on D3 (gap: Item action buttons). Both pass the
  position check.
- **Copy button.** The path badge's copy icon is a plain button with the
  library's `CopyIcon`, as on D3 (gap: Path badge copy button).
