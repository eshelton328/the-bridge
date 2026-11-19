# T02 deviations

What still differs from Figma after round 3 of the fidelity loop
(`pnpm fidelity toolkit T02`, 2026-11-17, against the installed library
1.0.0-beta.10), each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/toolkitMapTablet.ts`: D2's map, with the
first heading "Rules, hooks" and no "every session" on writing. The
numbers below are from the run with library 1.0.0-beta.15 and the props
that library #115 added: `ViewSwitch tone="accent"` and
`FilterChips padding="none"`. A rerun of `pnpm fidelity toolkit` on
2026-11-18, against library 1.0.0-beta.47 with the list options of
library #166, gives the same Checks: the map view uses none of them.
A rerun on 2026-11-19, against library 1.0.0-beta.69 with library
#211's compact nodes (`MapGraph nodeDensity="compact"`) and links with
no end dot (`edgeEnd="none"`), gives the Checks below.

The map is the library's `MapGraph` with 140 × 30 compact nodes, links
that end at the node's edge and no legend,
and the selected item is `MapSelectionCard` with no description. The
nodes and the column headings are inside the library's SVG, so they carry
no `data-figma`, and the position check measures only the page, the
header, the chips, the canvas, the selection and the tab bar.

## Checks

- Text: pass. Every Figma string is in the render, and `pr-description`
  (428:458) shows whole in its compact node, as in Figma. Nine names
  that Figma also cuts with an ellipsis (428:421, 428:466, 428:487,
  428:497, 428:502, 428:507, 428:512, 428:523, 428:529) are in
  `exceptions.json`.
- Position: 12 of 14 layers pass; `toolkit` and `selection · writer`
  fail (see Toolkit box and Selection bar). The passing layers are
  `header`, `read-only`,
  `view · List, Map or Activity`, `filter · chips`, `map canvas` and
  `tab bar`.
  The shared navigation's items pass too: `tab · Home`, `tab · Inbox`,
  `tab · Workspaces`, `tab · Projects`, `tab · Artifacts` and
  `tab · More`.
- Rules: pass.

## Deviations

- **Selection bar.** Figma shows the selected writer in a bar across the
  foot of the map, 684 × 62, with the name, the kind, the counts, Open
  writer and a bare x on one line. The render shows the library's card
  at the bottom right, 320 × 130: the title and a bordered close button,
  the counts under them, and a full-width Open writer button with a
  chevron (`selection · writer` x +351, y -77, w -364, h +68; gap: Map
  selection bar).
- **Node labels (closed 2026-11-19).** The compact node
  (`nodeDensity="compact"`, library #211) has a 12 px kind icon and puts
  the name 27 px in, against Figma's 13 px icon and 28 px, so
  `pr-description` shows whole and the names Figma cuts end where
  Figma's do. The 12 px icon is the nearest icon token to 13.
- **Toolkit box.** Figma's `toolkit` layer (428:302) is the page's
  content box, 712 wide from x 22, ending at the tab bar (h 1040). The
  render's `toolkit` is the page with its 24 px sides, 756 wide from x 0
  (`toolkit` x -22, y -12, w +44, h +12). The side is 24 px against
  Figma's 22: no space token has 22. For the same reason the map canvas
  is 708 px wide against 712 (within the tolerance).
- **View switch.** List, Map and Activity and the Read-only badge
  before them pass the position check, and with `tone="accent"` the
  selected item (Map) has the selected fill with no border and a cyan
  label and icon, as in Figma. The switch is still 36 px high against
  Figma's 38, with a 2 px inset against 4 and 16 px icons against 15: 38
  is off the 4 px grid (d-100), and no icon token has 15 (gap: View
  switch 38 px).
- **Links in one column.** A link between two items of one column bows
  out 40 px for every length; Figma's tablet map bows 22.2 px for rows
  next to each other (project-setup to agents-md) and 65.7 for six rows,
  so the short curves stand further out and the long ones hug the column
  (gap: Map link bow).
- **Open writer.** The card's button opens writer's item page, as the
  list's rows do.

## Second review

- **Link ends (closed 2026-11-19).** The links end at the node's edge
  with no dot (`edgeEnd="none"`, library #211), as Figma's do.
- **Dimmed nodes.** The items writer does not touch are brighter than
  Figma's faint ones (gap: Map dimmed node).
- **Status bar and corners (not real).** Figma's 9:41 status bar and the
  rounded device corners are design-only chrome (d-089); the app draws
  neither.
