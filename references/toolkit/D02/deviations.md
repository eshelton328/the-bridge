# D02 deviations

What still differs from Figma after round 2 of the fidelity loop
(`pnpm fidelity toolkit D02`, 2026-11-17, against the installed library
1.0.0-beta.10), each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The numbers below are from
the run with library 1.0.0-beta.15 and the props that library #115 added:
`ViewSwitch tone="accent"` and `FilterChips padding="none"`. A rerun
of `pnpm fidelity toolkit` on 2026-11-18, against library
1.0.0-beta.47, gives the same Checks; only the search is narrower (see
Search width).

The map is the library's `MapGraph` with `MapLegend` and
`MapSelectionCard`; the screen places each item by its column and row
and draws no line of its own. The nodes and the column headings are
inside the library's SVG, so they carry no `data-figma` and the position
check measures only the canvas, the legend and the card.

## Checks

- Text: pass. Every string of the map, the legend and the card is on
  screen.
- Position: 14 of 17 layers pass (`toolkit`, `header`, `read-only`,
  `view · List, Map or Activity`, `list tools`, `counts legend`,
  `map canvas`, `legend`).
  The shared navigation's items pass too: `rail · Inbox`,
  `rail · Workspaces`, `rail · Projects`, `rail · Artifacts`,
  `rail · Toolkit` and `rail · More`.
- Rules: pass.

## Deviations

- **View switch.** List, Map and Activity pass the position check, and
  with `tone="accent"` the selected item (Map) has the selected fill with
  no border and a cyan label and icon, as in Figma. The switch is still
  36 px high against Figma's 38, with a 2 px inset against 4 and 16 px
  icons against 15: 38 is off the 4 px grid (d-100), and no icon token
  has 15 (gap: View switch 38 px).
- **Kind chips.** The chip row is 565.8 px wide against Figma's 580 and
  32 high against 34 (`filter · chips` w -14.2). With `padding="none"`
  the row has no inset, as in Figma. The `md` chips are 32 px high with
  10 px sides, where Figma's desktop chips are 34 high and each about
  2 px wider. 34 is off the 4 px grid (d-100), and no control token has
  34 (gap: Kind chip row). The search
  under the row starts 4 px higher (within the tolerance).
- **Search width.** The search is 684 px wide against Figma's 566
  (`search` w +118). No size token has 566, so the row is the cards'
  grid and the list view's search and Sort span its first two columns;
  the map has no Sort, and the search takes both columns (gap: Toolkit
  search width). Before the list tools moved onto the grid it was 692.
- **Selection card.** The writer card is 320 px wide against Figma's
  300, so its left edge is 21 px further left, and it starts 8 px higher
  (`selection · writer` x -21, y -8, w +20). It is 172 px high against
  169 and ends 5 px higher than Figma's. Its
  close button is a small bordered button where Figma draws a bare x,
  and the counts line has three spaces between `→ links to 7` and
  `← linked from 4` where Figma has five (gap: Map selection card).
- **Links in one column.** A link between two items of one column bows
  out 40 px for every length; Figma bows longer links further
  (`commits-and-prs` to `commit-msg` 88.5 px, `writing` to `readmes`
  49.5), so in the render those curves hug the Rules column (gap: Map
  link bow).
- **Open writer.** The card's button has no action yet: the item page
  (D3) is a later frame.
- **Rail Artifacts icon.** Figma draws `icon/artifacts` at 20 px (426:37)
  where the other rail icons are 22; the shared AppRail draws every item's
  icon at 24 (d-100), so the render's icon is 24 and `exceptions.json`
  names 426:37 (bridge-coord's shared decision, 2026-11-19).
- **Rail Toolkit icon.** Figma draws `icon/toolkit` at 20 px (426:42)
  where the other rail icons are 22; the shared AppRail draws every item's
  icon at 24 (d-100), so the render's icon is 24 and `exceptions.json`
  names 426:42, as for `icon/artifacts`.

## Second review

- **Source note (not real).** The reviewer saw a comma after "Read from
  toolkit/ in the brain". The text check passes and the code has no
  comma; the marks are the feet of Geist Mono's "i" and "n" at 1x, which
  the Figma mono font does not draw.
