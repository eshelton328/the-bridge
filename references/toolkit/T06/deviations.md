# T06 deviations

What still differs from Figma after the fidelity loop
(`pnpm fidelity toolkit T06`, 2026-11-18, against library 1.0.0-beta.28),
each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/scriptExplainedTablet.ts`: D10's data
(`scriptExplained`) with the browser's `badge`, the script's language and
length as its meta, no line on what uses it, and `ui.filePage`. On a
tablet a script with an explanation opens on a page of its own in the
shared `DetailFrame` (d-107): Back to Files with Discuss and Show on map,
the script's name and path badge, the tabs, the Explain and Code switch in
a row of its own (`ToolkitFilePage`) and the explanation in a bordered
box. D06, D10, D33 to D36, T04, T07, T10 and T19 give the same results as
before T06.

## Checks

- Text: pass (52 strings checked). Nothing lies under the tab bar.
- Position: 15 of 18 layers pass (`back row`, `button · Show on map`,
  `title`, `path row`, `path badge`, `mode row`,
  `toggle · Explain | Code`, `explain`, `tab bar` and the six tabs of the
  navigation). The 3 that fail (`button · Discuss`, `toolkit item`,
  `440:1773`) are listed below.
- Rules: pass.

## Deviations

- **Item frame.** Figma's `toolkit item` (440:1760) holds the back row
  and the item, from y 41 to the tab bar. In `DetailFrame` the back row is
  the ScrollFrame's header and the item is the body under it, so the
  article starts under the back row and is as high as its content
  (`toolkit item` y +32, h -258, x +2, w -4: the Container pads 24 at the
  sides against 22). This is the d-107 structure that keeps Back in view.
  Gap: Tablet item spacing.
- **Title.** check is 82 by 40 against Figma's 77 and 38 (`440:1773`
  w +5.3): the `heading` glyphs and line height, as on T03 and T04
  (d-090).
- **Back row.** The back row is 32 px high against Figma's 36. Discuss is
  99.5 px wide against 97, so it starts 5 px further left
  (`button · Discuss` x -5.1, h -2). Files and its chevron are `BackRow`'s
  `labelLg` and 18 px chevron. Gap: Item action buttons.
- **Explanation.** `ScriptExplanation` pads 20 against 19, its card 16 by
  12 against 15 by 13, draws 24 px step numbers against 22 and a 12 px
  spark against 13, and sizes the fact keys to their text, so In, Out and
  Exit's values start about 8 px further left than Figma's 40 px key
  column. Figma's summary runs past the card's right edge; the render
  wraps it inside the card, so its first line ends at "and so" against
  "and so does". The steps wrap a word earlier in places (steps 1, 2 and
  4). Gap: Script explanation.
- **Explain and Code switch.** `ViewSwitch size="md"` is 32 high against
  34, so the box starts 2 px higher; the row is 12 under the tabs and the
  box 12 under the row against 14 (no space token has 14). Gaps: Explain
  and Code switch, Tablet item spacing.
- **Item tabs.** The selected tab's outline is `border.selected` at half
  alpha where Figma's is solid cyan (no solid selected token, d-050).
