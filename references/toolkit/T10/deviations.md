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
D38, D39 and T03 give the same results as before T10. The Checks below are
from a rerun with library 1.0.0-beta.25 and the item tabs' `tone` and
`density` props (2026-11-17).

## Checks

- Text: pass (68 strings checked). The chat path's second row (501:126
  to 501:141) lies under the tab bar and passes since the bar lies over
  the page; see Under the tab bar.
- Position: 25 of 29 layers pass (`back row`, `button · Show on map`,
  `461:255`, `steps`, `step 1` to `step 8`, the six `uses · …` chips and
  `tab bar`). The 4 that fail (`button · Discuss`, `toolkit item`,
  `trigger`, `chat path`) are listed below.
  The shared navigation's items pass too: `tab · Home`, `tab · Inbox`,
  `tab · Workspaces`, `tab · Projects`, `tab · Artifacts`
  and `tab · More`.
- Rules: fail. One `hiddenOverflow` finding: the item's ScrollFrame body
  (`div.scroll-frame__body`), see Under the tab bar.

## Deviations

- **Under the tab bar.** Figma draws the chat path down past the tab bar:
  its second row of steps (501:124 to 501:141, y 1062 to 1095) runs under
  the tab bar at y 1081, and the chat path ends at 1110. The tab bar lies
  over the page (AppShell `tabBarOverlay`, library 1.0.0-beta.26): the
  DetailFrame body runs under the bar as Figma's item does, so the second
  row lies under the bar in both and the text check passes it. The rest
  of the item scrolls, and the rule check reports the scrolling body as
  `hiddenOverflow`. This is the scroll that Figma's own layout causes, as
  on M22. It is not an exception.
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
- **Item tabs.** `ItemTabs density="compact" tone="accent"` (library #126,
  beta.21) starts the tabs at the list's edge with 10 px sides and draws
  How it works' label cyan, as Figma's. The outline stays
  `border.selected` at half alpha where Figma's is solid cyan (no solid
  selected token, d-050), and Activity starts about 8 px further right, as
  each label renders a little wider. The compact list is 4 px shorter and
  the item adds 4 above the panel, so the panel starts where it did; the
  column starts 4 higher than the panel puts it (16 under the tabs against
  Figma's 12), so the trigger is in place.
