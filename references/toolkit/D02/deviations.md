# D02 deviations

What still differs from Figma after round 2 of the fidelity loop
(`pnpm fidelity toolkit D02`, 2026-11-17, against the installed library
1.0.0-beta.10), each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`.

The map is the library's `MapGraph` with `MapLegend` and
`MapSelectionCard`; the screen places each item by its column and row
and draws no line of its own. The nodes and the column headings are
inside the library's SVG, so they carry no `data-figma` and the position
check measures only the canvas, the legend and the card.

## Checks

- Text: pass. Every string of the map, the legend and the card is on
  screen.
- Position: 6 of 11 layers pass (`toolkit`, `header`, `list tools`,
  `counts legend`, `map canvas`, `legend`).
- Rules: pass.

## Deviations

- **View switch.** List, Map and Activity are 232.5 px wide and 36 high
  against Figma's 239 and 38, with 12 px icons against 15
  (`view · List, Map or Activity` x +6.5, w -6.5; gap: View switch
  38 px). The Read-only badge before it moves right with it
  (`read-only` x +8.2). The selected item (Map) has a cyan outline and
  a white label, where Figma draws the fill alone with a cyan label.
- **Kind chips.** The chip row is 594 px wide against Figma's 580 and
  36 high against 34 (`filter · chips` w +13.8): `FilterChips` pads the
  row 2 px and its labels are a little wider (gap: Kind chip row).
- **Search width.** The search is 692 px wide against Figma's 566
  (`search` w +126). No size token has 566, so the list view gives the
  search and Sort half the row; the map has no Sort, and the search
  takes all of that half (gap: Toolkit search width).
- **Selection card.** The writer card is 320 px wide against Figma's
  300, so its left edge is 21 px further left (`selection · writer`
  x -21, w +20), and it ends 4 px higher (within the tolerance). Its
  close button is a small bordered button where Figma draws a bare x,
  and the counts line has three spaces between `→ links to 7` and
  `← linked from 4` where Figma has five (gap: Map selection card).
- **Links in one column.** A link between two items of one column bows
  out 40 px for every length; Figma bows longer links further
  (`commits-and-prs` to `commit-msg` 88.5 px, `writing` to `readmes`
  49.5), so in the render those curves hug the Rules column (gap: Map
  link bow).
- **Rail.** The rail items are 54 px high and 60 px apart against
  Figma's 50 and 56, so Workspaces to More sit 4 to 20 px lower (gap:
  Rail item height).
- **Open writer.** The card's button has no action yet: the item page
  (D3) is a later frame.
