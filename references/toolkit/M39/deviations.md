# M39 deviations

What still differs from Figma after round 1 of the fidelity loop
(`pnpm fidelity toolkit M39`, 2026-11-17, against library 1.0.0-beta.20),
each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/ruleHowItWorksPhone.ts`: T36's data
(`ruleHowItWorksTablet`, which is D37's with no line on what Codex does
instead). On the phone the item replaces the list in the shared
`DetailFrame` (d-107), as M19's does, and keeps M19's header: the back
row to Toolkit with the icon buttons, the kind badge with when it
changed, the name and the path badge. The How it works tab is
`ToolkitHowColumn` with `layout="phone"`; its `how` is not `named`, so
the rows are 12 apart, as the header's are, and the steps start 6 under
the taller trigger. D14, D37, D38, D39, T10, M12, T36, T37, T38 and M19
give the same results as before M39. The Checks below are from a rerun
with library 1.0.0-beta.25 and the item tabs' `tone` and `density` props
(2026-11-17).

## Checks

- Text: pass. Every Figma string is in the render and visible; no extra
  text and no covered text.
- Position: 19 of 22 layers pass (`back row`, `button · map`,
  `meta row`, `kind badge`, `path badge`, `steps`, `step 1` to `step 4`,
  the three `uses · …` chips and `tab bar`). The 3 that fail
  (`button · Discuss`, `toolkit`, `trigger`) are listed below.
  The shared navigation's items pass too: `tab · Home`, `tab · Inbox`,
  `tab · Workspaces`, `tab · Projects` and `tab · More`.
- Rules: fail. One `hiddenOverflow` finding: the item tabs' list
  (`div.item-tabs__list`); see Item tabs.

## Deviations

- **Item tabs.** `ItemTabs density="compact" tone="accent"` (library #126,
  beta.21) starts the tabs at the list's edge with 10 px sides and draws
  How it works' label cyan, as Figma's, so Evals ends inside the 390 px
  screen and only Activity runs past it (the list's sideways scroll is the
  `hiddenOverflow` finding, which Figma's row has too). The outline stays
  `border.selected` at half alpha where Figma's is solid cyan (no solid
  selected token, d-050).
- **Discuss button.** Figma's Discuss is an icon button 36 × 28; an
  icon-only `Button` is square, so Discuss is `sm`, 28 × 28, and starts
  8 px further right (`button · Discuss` x +8, w -8). Show on map is
  36 × 36, as in Figma. Gap: Item action buttons.
- **Item frame.** Figma's `toolkit` (495:2926) holds the back row and the
  item, from y 42 down to the tab bar at y 767. In `DetailFrame` the back
  row is the ScrollFrame's header and the item is the body under it, so
  the article starts under the back row and ends after its last step
  (`toolkit` y +36, h -101). This is the d-107 structure that keeps Back
  in view, as on M19 and M12.
- **Under the tab bar.** Figma draws nothing of the item under the tab
  bar here: step 4 ends at y 705. The render shows all of it above the
  bar, so no text is clipped at the bar's top.
- **Trigger.** Figma's trigger is 31 high, its text 7 px from the top and
  foot. `Panel variant="notice" tone="done"` pads it 10/12, so it is 38
  high (`trigger` h +7); it starts 1 px above Figma's, and the steps start
  6 under it, so they stay in place (gap: How it works trigger).
- **Step cards.** As on T36: a card with no uses is 60 high against 61,
  and one with uses 86 or 102 against 88 or 105 (the chips are 22 high
  against 23); the arrow rows are 16 high against 14, so each card stays
  within 3 px of Figma's. The chips' text is white where Figma colours it
  as the step's kind (gaps: How it works use chip, How it works steps).
  The step numbers are `Badge variant="outline"`, 22 high against 19.
- **Path badge.** The copy button is the library's bare icon button in
  the badge's `trailing` slot (gap: Path badge copy button). The badge
  passes the position check.
- **Tab bar.** The shared `AppTabBar` passes the position check, and its
  five items line up with Figma's.
