# T10 deviations

What still differs from Figma after the fidelity loop
(`pnpm fidelity toolkit T10`, 2026-11-17, against library 1.0.0-beta.20),
each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/skillHowItWorksTablet.ts`: D14's data
(`skillHowItWorks`), with the tablet's shorter trigger and step lines. On a
tablet the item replaces the list in the shared `DetailFrame` (d-107), as
T03's does, and the How it works tab is `ToolkitHowColumn`: no box, header,
legend or source line, the trigger across the item, the steps in one column
(`ToolkitHowStep compact`) and the chat path. The back row names the item
(Toolkit › writer), and the kind badge and path rows are left out. D14, D37,
D38, D39 and T03 give the same results as before T10.

## Checks

- Text: fail. Every Figma string is in the render; no extra text and no
  covered text. Eight strings of the chat path's second row are not
  visible: `5` (501:126), `Cut to the reader` (501:127), `6` (501:132),
  `Run the lint` (501:133), `--form chat --ste` (501:134), `→` (501:139),
  `Send the text` (501:140) and `unchanged` (501:141). See Under the tab
  bar.
- Position: 19 of 23 layers pass (`back row`, `button · Show on map`,
  `461:255`, `steps`, `step 1` to `step 8`, the six `uses · …` chips and
  `tab bar`). The 4 that fail (`button · Discuss`, `toolkit item`,
  `trigger`, `chat path`) are listed below.
- Rules: fail. One `hiddenOverflow` finding: the item's ScrollFrame body
  (`div.scroll-frame__body`), see Under the tab bar.

## Deviations

- **Under the tab bar.** Figma draws the chat path down past the tab bar:
  its second row of steps (501:124 to 501:141, y 1062 to 1095) runs under
  the tab bar at y 1081, and the chat path ends at 1110. The render
  scrolls the item in the DetailFrame body and cuts it at the top of the
  tab bar, so the second row's text (`5`, `Cut to the reader`, `6`,
  `Run the lint`, `--form chat --ste`, `→`, `Send the text`, `unchanged`)
  is not seen in full, as in Figma, and the rule check reports the
  scrolling body as `hiddenOverflow`. This is the scroll that Figma's own
  layout causes, as on M22; DetailFrame and ScrollFrame are shared and
  stay as they are. It is not an exception.
- **Chat path.** `ChatPath` is 7 px taller than Figma's box (`chat path`
  h +7), and its pills are spaced wider, so the second row starts a few
  px lower (gap: How it works steps). It starts in place.
- **Trigger.** Figma's trigger is 31 high, its text 7 px from the top and
  foot. `Panel variant="notice" tone="done"` pads it 10/12, so it is 38
  high (`trigger` h +7); the steps start 4 under it, so they stay in place
  (gap: How it works trigger).
- **Step cards.** A card with no uses is 60 high against 61, and one with
  uses 86 against 88 (the chips are 22 high against 23); the arrow rows
  are 16 high against 14, so each card stays within 2 px of Figma's. The
  chips' text is white where Figma colours it as the step's kind (a script
  cyan, an agent purple; gap: How it works use chip). The step numbers are
  `Badge variant="outline"`, 22 high against 19.
- **Item frame.** Figma's `toolkit item` (461:64) holds the back row and
  the item, from y 41 past the tab bar. In `DetailFrame` the back row is
  the ScrollFrame's header and the item is the body under it, so the
  article starts under the back row (`toolkit item` y +32, h -25, x +2,
  w -4: the Container pads 24 at the sides against 22). This is the d-107
  structure that keeps Back in view (gap: Tablet item spacing).
- **Back row.** The back row is 32 px high against Figma's 36 (gap: Item
  action buttons). Discuss is 99.5 px wide against 97 and ends 2 px
  further in, so it starts 7 px further left (`button · Discuss` x -7.1,
  h -2). Toolkit and its chevron are `BackRow`'s: `labelLg` and an 18 px
  chevron, where Figma has label text and 16 px (gap: Item breadcrumb).
- **Item tabs.** The selected tab (How it works) is white where Figma's is
  cyan (gap: Item tab selected tone), and the tabs are spaced wider:
  Activity ends about 30 px further right (gap: Item tab spacing). The
  tabs' panel puts its content 16 under the tabs against Figma's 12; the
  column starts 4 higher, so the trigger is in place.
- **Tab bar.** The six tab bar items spread across the full width, where
  Figma groups them in the centre. The tab bar is the shared `AppTabBar`
  (d-105), as on T01 to T03; its box passes the position check, and a
  change to it needs the app-frame lock.
