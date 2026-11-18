# M41 deviations

What still differs from Figma after the first run of the fidelity loop
(`pnpm fidelity toolkit M41`, 2026-11-17, against library 1.0.0-beta.20),
each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/hookHowItWorksPhone.ts`: T38's data
(`hookHowItWorksTablet`, which is D39's with no tests line and step 3's
use shown as a file). On the phone the item replaces the list in the
shared `DetailFrame` (d-107) and keeps M22's header: the back row with the
icon buttons, the kind badge with when it changed, the name and the path
badge. The How it works tab is `ToolkitHowColumn` with `layout="phone"`;
its `how` is not `named`, so the rows are 12 apart, as on M39 and M40.
D14, D37, D38, D39, T10, M12, T36, T37, T38, M39, M40 and M22 give the
same results as before M41.

## Checks

- Text: fail. Every Figma string is in the render; no extra text and no
  covered text. One string is not visible: `Evals` (495:3757), see Item
  tabs.
- Position: 15 of 18 layers pass (`back row`, `button · map`,
  `meta row`, `kind badge`, the title `495:3591`, `path badge`, `steps`,
  `step 1` to `step 5`, the two `uses · …` chips and `tab bar`). The 3
  that fail (`button · Discuss`, `toolkit`, `trigger`) are listed below.
- Rules: fail. One `hiddenOverflow` finding: the item tabs' list
  (`div.item-tabs__list`); see Item tabs.

## Deviations

- **Item tabs.** The selected tab (How it works) is white where Figma's
  is cyan (gap: Item tab selected tone). `ItemTabs` pads its list 2 and
  each tab 12, where Figma's tabs are 10 in with no list padding, so the
  row is wider and Evals is cut at the screen's edge (`Evals` not
  visible; the list's sideways scroll is the `hiddenOverflow` finding,
  which Figma's row has too, with Activity past the edge). Gap: Item tab
  spacing. A parallel library PR sets these props; the tabs are not
  styled by hand here.
- **Discuss button.** Figma's Discuss is an icon button 36 × 28; an
  icon-only `Button` is square, so Discuss is `sm`, 28 × 28, and starts
  8 px further right (`button · Discuss` x +8, w -8). Show on map is
  36 × 36, as in Figma. Gap: Item action buttons.
- **Item frame.** Figma's `toolkit` (495:3571) holds the back row and the
  item, from y 42 down to the tab bar at y 767. In `DetailFrame` the back
  row is the ScrollFrame's header and the item is the body under it, so
  the article starts under the back row and ends after its last step
  (`toolkit` y +36, h -67). This is the d-107 structure that keeps Back
  in view, as on M22, M39 and M40.
- **Under the tab bar.** Figma draws nothing of the item under the tab
  bar here: step 5 ends at y 736. The render shows all five steps above
  the bar, so no text is clipped at the bar's top.
- **Trigger.** Figma's trigger is two lines, 48 high, its text 7 px from
  the top and foot. `Panel variant="notice" tone="done"` pads it 10/12, so
  it is 54 high (`trigger` h +6); it starts 1 px above Figma's, and the
  steps start 6 under it, so they stay in place (gap: How it works
  trigger).
- **Step cards.** As on T38 and M40: the cards are within 3 px of
  Figma's, and the arrow rows are 16 high against 14. The chips' text is
  white where Figma colours it as the step's kind (gaps: How it works use
  chip, How it works steps). The step numbers are
  `Badge variant="outline"`, 22 high against 19.
- **Path badge.** The copy button is the library's bare icon button in
  the badge's `trailing` slot (gap: Path badge copy button). The badge
  passes the position check.
- **Tab bar.** The shared `AppTabBar` passes the position check, and its
  five items line up with Figma's.
