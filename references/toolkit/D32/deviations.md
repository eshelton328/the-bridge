# D32 deviations

What still differs from Figma after the first run of the fidelity loop
(`pnpm fidelity toolkit D32 D31 D30 D29 D19 D03 D06 D07 D08 D09 D10 D13 D14 D33`,
2026-11-18, against the installed library 1.0.0-beta.31), each with its
reason. The library gaps are in `web/src/pages/toolkit/LIBRARY_GAPS.md`.
The state is `web/src/pages/toolkit/states/hookLinks.ts`: D9's data (the
Rules, Workflows and Hooks groups), with the hook commit-msg open on its
Links tab. D31, D30, D29, D19, D03, D06, D07, D08, D09, D10, D13, D14 and
D33 give the same results as before D32 (each report's text, position and
rule results are unchanged). The frame has no `exceptions.json`.

The last fidelity run (`pnpm fidelity toolkit`, every Toolkit frame,
2026-11-18) used the installed library 1.0.0-beta.39 (#148, #151).
Text fails, 28 of 41 position layers pass and the rules fail: the same
results, failing keys and findings as the run on beta.39 before this
change, so the checks below still hold.

## Checks

- Text: fail. All Figma strings are in the render, nothing extra shows,
  and no text is covered by another element. Five strings are not visible,
  all for the list pane, which D9 shares:
  - `Workflows` and `2` (493:2641, 493:2642), the Workflows chip, which
    the chip row cuts at the list pane's edge, as Figma does (see Kind
    chips).
  - `hooks/commit-msg` and `→1 ←1` (493:2772, 493:2774): the taller list
    rows push the open hook's row past the frame's bottom edge (see Row
    height).
  - `commit-msg` (493:3124): Figma shows commit-msg three times (the list
    row, the title and the graph's open item), and the render only twice,
    as its list row is under the frame's foot (see Row height). The check
    gives each layer its own occurrence, so one of the three, here the
    graph's, has none; the graph's open item shows commit-msg in the
    render.
- Position: 28 of 41 layers pass, among them every layer of the Links
  tab: `links`, `links header`, `links graph`, `row · in and out`,
  `panel · linked from`, `panel · links to`,
  `link · commits-and-prs · rules/commits-and-prs.md:182` and
  `link · commits-and-prs · commit-msg:3`; and `toolkit list`, `header`,
  `read-only`, `filter · chips`, `search`, `group · RULES`,
  `toolkit item`, `meta row`, `kind badge`, `button · Discuss`,
  `button · Show on map`, `493:2794` (the title commit-msg), `path row`,
  `path badge` and the rail's items.
- Rules: fail. Two `hiddenOverflow` findings: the list pane scrolls on its
  own (`[data-figma="toolkit list"]`), and the kind chips scroll sideways
  (`[data-figma="filter · chips"] > div.filter-chips__root`). D03 has both
  in its `exceptions.json`; this frame takes no exceptions.

## Deviations

- **Row height.** Each list row is 62 px high against Figma's 53
  (`h +9` on every row key; the selected row `h +7`), as on D9: `ListRow`
  pads 10 inside a 1 px border (gap: Toolkit row (pane)). The first row
  starts within the tolerance and each row after it 9 px lower again:
  `toolkit row · commits-and-prs` h +9;
  `toolkit row · diagrams` y +12; `toolkit row · linear` y +21;
  `toolkit row · readmes` y +30; `toolkit row · releases` y +39;
  `toolkit row · skills` y +48; `toolkit row · ste100` y +57;
  `toolkit row · writing` y +66; `group · WORKFLOWS` y +75;
  `toolkit row · skill-eval-cases` y +78;
  `toolkit row · skill-eval-round` y +87; `group · HOOKS` y +96;
  `toolkit row · commit-msg` y +99.
- **Kind chips.** The chip row is wider than the list pane and scrolls
  sideways; Figma cuts the Workflows chip at the same edge, so `Workflows`
  and `2` are not visible in either.
- **Graph's open item.** commit-msg in the middle of the graph has its
  name in the label style, as Figma's, since library beta.39
  (`labelStyle: 'label'`, #151), but is 180 × 32, as the items at the
  sides are, against Figma's 150 × 40 with a 15 px icon; it is centred
  where Figma centres it, so its lines start and end 15 px further out.
  beta.39 gives a node its own `size`, but four tests of
  `linksView.test.ts` assert the open item at 180 × 32, and a change to
  those lines waits for Erik (gap: Links graph).
- **Node borders.** Since library beta.39 (#151) each item at a side of
  the graph has its kind's colour at 60 % alpha (`MapGraph
  nodeTone="muted"`, `kindBorder.*`) and each link row's node at 45 %
  (`MapNode tone="faint"`, `kindBorderFaint.*`), with the icons in the
  full kind colour, as in Figma. The icons are 16 px against Figma's 13:
  `MapNode` takes no icon size (gap: Links graph, Links panel rows).
- **Link nodes.** commits-and-prs at the start of each link row is a
  `MapNode` 28 px high against Figma's 29 and a few px wider, and the file
  and line at the row's end is a plain mono button in the accent colour
  (gap: Links panel rows). Both rows pass the position check.
- **Buttons.** Discuss and Show on map are both 32 px high, against
  Figma's 34 and 36, as on D9 (gap: Item action buttons). Both pass the
  position check.
- **Copy button.** The path badge's copy icon is a plain button with the
  library's `CopyIcon`, as on D9 (gap: Path badge copy button).
