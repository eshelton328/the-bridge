# T02 deviations

What still differs from Figma after round 3 of the fidelity loop
(`pnpm fidelity toolkit T02`, 2026-11-17, against the installed library
1.0.0-beta.10), each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/toolkitMapTablet.ts`: D2's map, with the
first heading "Rules, hooks" and no "every session" on writing.

The map is the library's `MapGraph` with 140 × 30 nodes and no legend,
and the selected item is `MapSelectionCard` with no description. The
nodes and the column headings are inside the library's SVG, so they carry
no `data-figma`, and the position check measures only the page, the
header, the chips, the canvas, the selection and the tab bar.

## Checks

- Text: fail. Every Figma string is in the render. `pr-description`
  (428:458) is not visible: the skill's node cuts it with an ellipsis,
  where Figma shows it in full (see Node labels). Nine names that Figma
  also cuts with an ellipsis (428:421, 428:466, 428:487, 428:497,
  428:502, 428:507, 428:512, 428:523, 428:529) are in `exceptions.json`.
- Position: 2 of 8 layers pass (`header`, `tab bar`).
- Rules: pass.

## Deviations

- **Selection bar.** Figma shows the selected writer in a bar across the
  foot of the map, 684 × 62, with the name, the kind, the counts, Open
  writer and a bare x on one line. The render shows the library's card
  at the bottom right, 320 × 130: the title and a bordered close button,
  the counts under them, and a full-width Open writer button with a
  chevron (`selection · writer` x +351, y -73, w -364, h +68; gap: Map
  selection bar).
- **Node labels.** The node's name has 96 px against Figma's 104, with a
  16 px kind icon against 13: `MapNode` pads 10 px and puts the name
  34 px in, where Figma puts it 28 px in. So `pr-description` (the skill)
  ends in an ellipsis, and each name that Figma cuts shows one or two
  letters fewer (gap: Map node 140 px).
- **Toolkit box.** Figma's `toolkit` layer (428:302) is the page's
  content box, 712 wide from x 22, ending at the tab bar (h 1040). The
  render's `toolkit` is the page with its 24 px sides, 756 wide from x 0
  (`toolkit` x -22, y -12, w +44, h +12). The side is 24 px against
  Figma's 22: no space token has 22. For the same reason the map canvas
  is 708 px wide against 712 (within the tolerance).
- **Map canvas.** The canvas starts 6 px lower (`map canvas` y +6): the
  chip row above it is 36 px high against Figma's 32 (see Kind chips),
  and the page's top is 2 px lower. Every node and line sits 6 px lower
  with it.
- **View switch.** List, Map and Activity are 232.5 px wide and 36 high
  against Figma's 239 and 38, with 12 px icons against 15
  (`view · List, Map or Activity` x +4.5, w -6.5; gap: View switch
  38 px). The Read-only badge before it moves right with it
  (`read-only` x +5.2). The selected item (Map) has a cyan outline and a
  white label, where Figma draws the fill alone with a cyan label.
- **Kind chips.** The chip row is 594 px wide and 36 high against
  Figma's 568 and 32 (`filter · chips` w +25.8): `FilterChips` pads the
  row 2 px and its labels are wider (gap: Kind chip row).
- **Links in one column.** A link between two items of one column bows
  out 40 px for every length; Figma's tablet map bows 22.2 px for rows
  next to each other (project-setup to agents-md) and 65.7 for six rows,
  so the short curves stand further out and the long ones hug the column
  (gap: Map link bow).
- **Tab bar.** The shared `AppTabBar` (`device="tablet"`, More selected,
  d-105) spreads its six tabs over the full width; Figma keeps them 76 px
  wide in the middle. Its box passes the position check; this frame does
  not change the shared block.
- **Open writer.** The bar's button has no action yet: the item page
  (D3) is a later frame.

## Second review

- **Link ends.** MapGraph draws a small dot where a link meets a node;
  Figma has no end marker (gap: Map link ends).
- **Dimmed nodes.** The items writer does not touch are brighter than
  Figma's faint ones (gap: Map dimmed node).
- **Status bar and corners (not real).** Figma's 9:41 status bar and the
  rounded device corners are design-only chrome (d-089); the app draws
  neither.
