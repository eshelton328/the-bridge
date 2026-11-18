# T26 deviations

What still differs from Figma after the fidelity loop
(`pnpm fidelity toolkit T26`, 2026-11-18, against library 1.0.0-beta.36:
a first run and three fix rounds), each with its reason. The library
gaps are in `web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/workflowEvalsTablet.ts`: D27's data; the
workflow keeps T18's header. Every other Toolkit frame (T03, T04, T06 to
T08, T10, T15, T17 to T19 and T28 to T38 and the list frames) gives the
same text, position and rule results as before the Evals tab. The frame
has no `exceptions.json`.

## Checks

- Text: pass. Every Figma string is in the render and visible, and
  nothing extra shows.
- Position: 19 of 22 layers pass. The 3 that fail: `button · Discuss` x
  -5.1 y -1 w +2.5 h -2; `toolkit item` x +2 y +32 w -4 h -540;
  `492:3093` x +2 y -1 w +14.7 h +2. Each is explained below.
- Rules: pass.

## Deviations

- **Item frame.** Figma's `toolkit item` holds the back row and the
  item, from y 41 down to the tab bar. In `DetailFrame` the back row is
  the ScrollFrame's header and the item is the body under it, so the
  article starts under the back row and ends with the tab's source line
  (`toolkit item` x +2 y +32 w -4 h -540: the Container pads 24 at the
  sides against 22). This is the d-107 structure that keeps Back in
  view, as on T17 and T28 (gap: Tablet item spacing).
- **Back row.** The back row is 32 px high against Figma's 36 (gap: Item
  action buttons). Discuss is wider than Figma's, so it starts further
  left (`button · Discuss` x -5.1 y -1 w +2.5 h -2).
- **Title width.** The title renders wider than Figma's (`492:3093` x +2
  y -1 w +14.7 h +2), as on T17, T37 and T38: the heading text style
  draws the name a little wider.
- **from the file.** The link at the gates panel's end is a plain button
  in the small style and the accent colour that opens the workflow's
  Files tab on its design doc (D35); the library has no small text link
  (gap: Evals panels).
- **Item tabs.** Since library #153 (beta.42) only the selected tab has
  a border, so each tab is within 1.1 px of Figma's width and Activity
  ends at 462.3 against Figma's 463; the tabs start at 24 against 22,
  the Container's 24 px side. The selected tab's outline is
  `border.selected` at half alpha where Figma's is solid cyan (d-050).
