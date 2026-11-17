# M11 deviations

What still differs from Figma after round 3 of the fidelity loop
(`pnpm fidelity toolkit D01 T01 M01 M04 D02 T02 M11`, 2026-11-17, against
the installed library 1.0.0-beta.10), each with its reason. The library
gaps are in `web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/toolkitMapTablet.ts`, T2's: M11 shows the
same items, rows, links and headings, with writer selected. D01, T01,
M01, M04, D02 and T02 give the same results as before M11.

The map is the library's `MapGraph` with T2's 140 × 30 nodes, in a
366 × 500 window (`map viewport`) that scrolls sideways. The hint is a
`Badge`, and the selected item is `MapSelectionCard` with no description,
under the window. The nodes and the column headings are inside the
library's SVG, so they carry no `data-figma`.

## Checks

- Text: fail.
  - missing: `→7 ←4` (461:1266) and `Show links` (461:1274): the card
    has no Show links button and writes the counts in words (see
    Selection card).
  - extra: `→ links to 7 ← linked from 4`, the card's counts line.
  - notVisible: the minimap's strings (461:1062 to 461:1242): `RULES,
    HOOKS`, `SKILLS`, `AGENTS`, `WORKFLOWS`, `writing`, `ste100`,
    `readmes`, `commits-and-prs`, `diagrams`, `skills`, `linear`,
    `releases`, `commit-msg`, `audit-slop`, `pr-description`, `readme`,
    `mermaid-diagrams`, `eval-cases`, `project-setup`, `agents-md`,
    `ambitious`, `writing-reviewer`, `writer`, `pr-description-checker`,
    `readme-cold-reader`, `diagram-reviewer`, `eval-case-writer`,
    `eval-grader`, `skill-eval-cases` and `skill-eval-round`. The render
    has no minimap (see Minimap). Each Figma layer needs its own visible
    occurrence, so the card's `writer` (461:1263) also counts as not
    visible: the minimap's two `writer` layers and the card's take more
    visible `writer` runs than the render has without a minimap.
  - notVisible: `pr-description` (461:977): the skill's node cuts it
    with an ellipsis, where Figma shows it in full (see Node labels).
  - `exceptions.json` covers `commits-and-prs` (461:940) and
    `mermaid-diagrams` (461:985), which Figma also cuts with an ellipsis,
    and `commit-msg` (461:965) and `ambitious` (461:1001), whose nodes
    lie below the window's bottom edge, where Figma's window clips them.
- Position: 7 of 9 layers pass (`header`, the three view buttons,
  `map viewport`, `hint`, `tab bar`); `toolkit` and `selection · writer`
  fail.
- Rules: pass. The window's sideways scroll (`hiddenOverflow` on the
  `MapGraph` scroller) is in `exceptions.json`: Figma's window cuts the
  drawing at the same edge.

## Deviations

- **Minimap.** Figma shows a small map of the whole drawing in the
  window's top right corner, 93 × 116, with a box for the part in view.
  The render has none, so the writer node, its lines and the top of
  audit-slop show there in full (gap: Map minimap).
- **Selection card.** Figma's card under the window is 366 × 90: one
  row with the icon, writer, Skill and the counts `→7  ←4` at the right
  end, then a cyan Show links button with a links icon and a dark Open
  writer button side by side, and no close button. The render's card is
  130 high: the title row ends in a bordered close button, the counts
  read `→ links to 7   ← linked from 4` on their own line, and one
  full-width cyan Open writer button with a chevron takes the last row;
  there is no Show links (`selection · writer` h +40; gap: Map selection
  card (phone)).
- **Window.** Figma's window drags both ways and pinch zooms (note).
  `MapGraph` has no window size and no zoom, so the render draws the map
  498 px high, the window's inside: it scrolls sideways only, the rows
  under the window (ambitious, commit-msg) cannot be reached, and there
  is no zoom (gap: Map window). The window's box matches Figma.
- **Hint.** The hint pill is the library's quiet badge: 30 px high
  against 27, with a border where Figma draws a dark fill (gap: Map hint
  pill). Its box passes the position check.
- **Node labels.** The node's name has 96 px against Figma's 104, with a
  16 px kind icon against 13, so `pr-description` (the skill) ends in an
  ellipsis and each name that Figma cuts shows one or two letters fewer
  (gap: Map node 140 px).
- **Links in one column.** A link between two items of one column bows
  out 40 px for every length; Figma bows 22.2 px for rows next to each
  other (project-setup to agents-md) and 65.7 for six rows (gap: Map link
  bow).
- **View buttons.** List, Map and Activity are the library's secondary
  icon buttons with 16 px icons; Figma's selected Map button has a cyan
  icon, where the pressed button keeps it white (gap: Phone view
  buttons). Their boxes pass.
- **Toolkit box.** Figma's `toolkit` layer (461:709) is the page's
  content box, 366 wide from x 12. The render's `toolkit` is the page
  with its 12 px sides, 390 wide from x 0 (`toolkit` x -12, w +24), as
  on T2 and M1. Everything inside it is at Figma's place.
- **Open writer.** The card's button has no action yet: the item page
  (D3) is a later frame.
