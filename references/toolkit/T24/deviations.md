# T24 deviations

What still differs from Figma after the fidelity loop
(`pnpm fidelity toolkit T24`, 2026-11-18, against library 1.0.0-beta.36:
a first run and three fix rounds), each with its reason. The library
gaps are in `web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/ruleEvalsTablet.ts`: D25's data; its
`results` does not set `named`, so the rule keeps T17's header (Toolkit,
the kind badge, the name and the path row). Every other Toolkit frame
(T03, T04, T06 to T08, T10, T15, T17 to T19 and T28 to T38 and the list
frames) gives the same text, position and rule results as before the
Evals tab. The frame has no `exceptions.json`.

## Checks

- Text: pass. Every Figma string is in the render and visible, and
  nothing extra shows.
- Position: 20 of 23 layers pass. The 3 that fail: `button · Discuss` x
  -5.1 y -1 w +2.5 h -2; `toolkit item` x +2 y +32 w -4 h -492;
  `492:2381` x +2 y -1 w +4.4 h +2. Each is explained below.
- Rules: pass.

## Deviations

- **Item frame.** Figma's `toolkit item` holds the back row and the
  item, from y 41 down to the tab bar. In `DetailFrame` the back row is
  the ScrollFrame's header and the item is the body under it, so the
  article starts under the back row and ends with the tab's source line
  (`toolkit item` x +2 y +32 w -4 h -492: the Container pads 24 at the
  sides against 22). This is the d-107 structure that keeps Back in
  view, as on T17 and T28 (gap: Tablet item spacing).
- **Back row.** The back row is 32 px high against Figma's 36 (gap: Item
  action buttons). Discuss is wider than Figma's, so it starts further
  left (`button · Discuss` x -5.1 y -1 w +2.5 h -2).
- **Title width.** The title renders wider than Figma's (`492:2381` x +2
  y -1 w +4.4 h +2), as on T17, T37 and T38: the heading text style
  draws the name a little wider.
- **Ledger rows.** Each ledger's name (writer, ambitious, agents-md,
  readme) is a plain button in the label style that opens the skill:
  writer on its Evals tab (D20), the others on their Overview. The
  library has no round row and no text link at this size, so the rows
  are styled with tokens (gap: Evals panels). The count 4 ledgers is
  accent text with no tap.
- **Item tabs.** The selected tab's outline is `border.selected` at half
  alpha where Figma's is solid cyan (d-050).
