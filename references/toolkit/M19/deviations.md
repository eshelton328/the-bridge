# M19 deviations

What still differs from Figma after round 1 of the fidelity loop
(`pnpm fidelity toolkit M19`, 2026-11-17, against library 1.0.0-beta.18),
each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/ruleOpenPhone.ts`: D4's data (`ruleOpen`),
with the rule skills open. On the phone the rule replaces the list in the
shared `DetailFrame` (d-107), as M2's skill does: the back row stays at the
top and the item scrolls under it (`web/src/app/ToolkitStickyBack.test.tsx`,
the M19 case). D03, D04, D07, D08, D09, T03, M02 and T17 give the same
results as before M19.

## Checks

- Text: fail. Every Figma string is in the render; no extra text and no
  covered text. One string is not visible: `Evals` (487:1282), see Item
  tabs.
- Position: 12 of 15 layers pass (`back row`, `button · map`,
  `meta row`, `kind badge`, `487:1264`, `path badge`, `487:1403`,
  `when it loads`, `file preview`, `preview bar`, `rendered markdown`,
  `tab bar`). The 3 that fail (`button · Discuss`, `toolkit`, `columns`)
  are listed below.
- Rules: fail. Two `hiddenOverflow` findings: the item's ScrollFrame
  body (`div.scroll-frame__body`) and the item tabs' list
  (`div.item-tabs__list`); see Under the tab bar and Item tabs.

## Deviations

- **Under the tab bar.** Figma draws the file preview down to y 785,
  past the tab bar at y 767; its last text line (487:1427) ends at 766,
  just over the bar. The render scrolls the item in the DetailFrame body
  and cuts the preview's foot at the same place, so the rule check reports
  the scrolling body as `hiddenOverflow`. No string is under the tab bar:
  the file's last line ends above it, as in Figma. This is the scroll
  that Figma's own layout causes, as on M02; it is not an exception yet.
- **Item tabs.** Figma's tabs are 10 px in at the sides with no list
  padding, so Evals ends at 378, inside the 390 px screen, and only
  Activity runs past it. `ItemTabs` pads its list 2 and each tab 12, so
  the row is about 35 px longer and Evals is cut at the screen's edge
  (`Evals` not visible; the list's sideways scroll is the second
  `hiddenOverflow`, which Figma's row has too). Gap: Item tab spacing.
- **Discuss button.** Figma's Discuss is an icon button 36 × 28; an
  icon-only `Button` is square, so Discuss is `sm`, 28 × 28, and starts
  8 px further right (`button · Discuss` x +8 w -8). Show on map is
  36 × 36, as in Figma, and the two are 8 apart. The icons are 16 px
  against Figma's 14 and 17. Gap: Item action buttons.
- **Item frame.** Figma's `toolkit` (487:1245) holds the back row and the
  item, from y 42 to the tab bar. In `DetailFrame` the back row is the
  ScrollFrame's header and the item is the body under it, so the article
  starts under the back row and runs to its last part
  (`toolkit` y +36, h -18). This is the d-107 structure that keeps Back
  in view, as on M02.
- **Columns height.** Figma's `columns` (487:1410) is 344 high, 40 px
  shorter than the file preview inside it (384). The render's columns
  hold the preview, 387 high (`columns` h +43; `file preview` passes).
  Gap: File preview.
- **Row spacing.** Figma's description, load box and file are 12 apart.
  The tabs' list is 36 high (Figma 32) and the Panel makes the load box
  58 high (Figma 56), so at 12 apart the file ran 5 px low and its last
  line went under the tab bar. The phone's rule overview puts the rows
  8 apart: the description is 3 px lower than Figma's, the box 1 px and
  the file 3 px higher. Gaps: Rule load box, Item tab spacing.
- **Load box.** The box spans the item as in Figma, and the condition
  wraps after `toolkit/skills/**` beside the label. The Panel pads it 12
  above and below and 16 at the sides, where Figma has 11 and 15, so the
  icon and the label sit 1 px further in. Gap: Rule load box.
- **Preview inset.** As on M02, the rendered file's text sits about 1 px
  lower in its box, and the box is 3 px taller (gap: File preview).
- **Copy button and preview bar.** As on M02 and T17: the copy icon is a
  plain button with `CopyIcon` (gap: Path badge copy button), and the
  preview box and bar are drawn with the Panel's tokens (gap: File
  preview).
- **Side.** Figma has an empty `side` layer (487:1428, 366 × 1) under the
  file; a rule has no side column (D4), so the render draws nothing there.
- **Tab bar.** The shared `AppTabBar` passes the position check, and its
  five items line up with Figma's.
