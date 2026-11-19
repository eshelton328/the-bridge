# M11 deviations

What still differs from Figma after round 3 of the fidelity loop
(`pnpm fidelity toolkit D01 T01 M01 M04 D02 T02 M11`, 2026-11-17, against
the installed library 1.0.0-beta.10), each with its reason. The library
gaps are in `web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/toolkitMapTablet.ts`, T2's: M11 shows the
same items, rows, links and headings, with writer selected. D01, T01,
M01, M04, D02 and T02 give the same results as before M11. The numbers
below are from the run with library 1.0.0-beta.15 and the prop that
library #115 added for the view buttons, `Button pressedTone="accent"`.
The Checks below are from a rerun on 2026-11-19, against library
1.0.0-beta.69 with library #211's parts: compact nodes, links with no end
dot, the minimap and the compact selection card.

The map is the library's `MapGraph` with T2's 140 × 30 compact nodes
(`nodeDensity="compact"`), links that end at the node's edge
(`edgeEnd="none"`) and the minimap (`minimap`), in a 366 × 500 window
(`map viewport`) that scrolls sideways. The hint is a `Badge`, and the
selected item is `MapSelectionCard density="compact"` with Show links
(`linksLabel`, `onLinks`) and no description or close button, under the
window. Show links opens the item on its Links tab (`openLinks` in
`screens/itemView.ts`): the note sends it to M3, a proposal with no
frame, and the Links tab (M17 on the phone) shows the same links. The nodes and the column headings are inside the
library's SVG, so they carry no `data-figma`.

## Checks

- Text: pass. `exceptions.json` covers six layers:
  `commits-and-prs` (461:940) and `mermaid-diagrams` (461:985), which
  Figma also cuts with an ellipsis; `commit-msg` (461:965) and
  `ambitious` (461:1001), whose nodes lie below the window's bottom edge,
  where Figma's window clips them; and the minimap's `commit-msg`
  (461:1159) and `ambitious` (461:1195), which the render's minimap does
  not draw (see Window).
- Position: 13 of 14 layers pass (`header`, the three view buttons,
  `map viewport`, `hint`, `selection · writer`, `tab bar`); `toolkit`
  fails (see Toolkit box).
  The shared navigation's items pass too: `tab · Home`, `tab · Inbox`,
  `tab · Workspaces`, `tab · Projects` and `tab · More`.
- Rules: pass. The window's sideways scroll (`hiddenOverflow` on the
  `MapGraph` scroller) is in `exceptions.json`: Figma's window cuts the
  drawing at the same edge.

## Deviations

- **Minimap (closed 2026-11-19).** The window shows the library's
  minimap in its top right corner (`minimap`, library #211), with a box
  for the part in view. It is shorter than Figma's (see Window).
- **Selection card (closed 2026-11-19).** The card under the window is
  the library's compact card (`density="compact"`, library #211),
  366 × 90 as Figma's: the icon, writer, Skill and `→7  ←4` on one row,
  then Show links with the links icon and Open writer side by side, and
  no close button. Its box passes the position check.
- **Window (2026-11-18).** Figma's window drags both ways and pinch
  zooms (note). The render's window pinch zooms from the whole drawing
  fitted to it up to 3 times and drags (MapGraph `zoom`, library #173),
  and opens at full size, as the screenshot shows. `MapGraph` has no
  window size, so the render draws the map 498 px high, the window's
  inside: the rows under the window (ambitious, commit-msg) are not in
  the drawing and cannot be reached (gap: Map window). The window's box
  matches Figma. The minimap draws that same drawing, so it is about
  85 × 60 against Figma's 93 × 116 and has no row for ambitious or
  commit-msg (461:1195, 461:1159).
- **Hint.** The hint pill is the library's quiet badge: 30 px high
  against 27, with a border where Figma draws a dark fill (gap: Map hint
  pill). Its box passes the position check.
- **Node labels (closed 2026-11-19).** The compact node has a 12 px
  kind icon against Figma's 13 and puts the name 27 px in, so
  `pr-description` shows whole, as in Figma.
- **Links in one column.** A link between two items of one column bows
  out 40 px for every length; Figma bows 22.2 px for rows next to each
  other (project-setup to agents-md) and 65.7 for six rows (gap: Map link
  bow).
- **View buttons.** List, Map and Activity are the library's secondary
  icon buttons. The pressed Map button has `pressedTone="accent"`, so
  its icon is cyan as in Figma. The icons are 16 px against Figma's 17
  (gap: Phone view buttons). Their boxes pass.
- **Toolkit box.** Figma's `toolkit` layer (461:709) is the page's
  content box, 366 wide from x 12. The render's `toolkit` is the page
  with its 12 px sides, 390 wide from x 0 (`toolkit` x -12, w +24), as
  on T2 and M1. Everything inside it is at Figma's place.
- **Open writer.** The button opens writer's item page, as the list's
  rows do.

## Second review

- **Link ends (closed 2026-11-19).** The links end at the node's edge
  with no dot (`edgeEnd="none"`), as Figma's do.
- **Stars.** The library `Backdrop` draws one fixed star set for the
  phone, taken from one Figma frame, so the faint stars sit in other
  places than M11's; most of them fall under the map window and the
  card. No change: a star layout for each frame is not worth a library
  part.
- **Status bar and corners (not real).** Figma's 9:41 status bar and the
  rounded device corners are design-only chrome (d-089).
