# M12 deviations

What still differs from Figma after round 2 of the fidelity loop
(`pnpm fidelity toolkit M12`, 2026-11-17, against library 1.0.0-beta.20),
each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/skillHowItWorksPhone.ts`: T10's data
(`skillHowItWorksTablet`, which is D14's with the shorter trigger and step
lines). On the phone the item replaces the list in the shared `DetailFrame`
(d-107), as M02's does, and the How it works tab is T10's
`ToolkitHowColumn` with `layout="phone"`: the rows 10 apart. The back row
names the item (Toolkit › writer) with M02's icon buttons, the title is in
the `title` text style, and the kind badge and path rows are left out.
D14, D37, D38, D39, T10 and M02 give the same results as before M12.

## Checks

- Text: fail. Every Figma string is in the render; no extra text and no
  covered text. Four strings are not visible: `Evals` (480:175, see Item
  tabs) and `writing-reviewer` (461:659), `until pass` (461:664) and `8`
  (461:670), see Under the tab bar.
- Position: 19 of 23 layers pass (`back row`, `button · map`, `461:560`,
  `steps`, `step 1` to `step 8`, the six `uses · …` chips and `tab bar`).
  The 4 that fail (`button · Discuss`, `toolkit`, `trigger`, `chat path`)
  are listed below.
- Rules: fail. Two `hiddenOverflow` findings: the item's ScrollFrame body
  (`div.scroll-frame__body`) and the item tabs' list
  (`div.item-tabs__list`); see Under the tab bar and Item tabs.

## Deviations

- **Under the tab bar.** Figma draws the item down to the chat path's end
  (y 1229), past the tab bar at y 767: step 7's chips (`writing-reviewer`,
  `until pass`, y 769 to 792), step 8 and the chat path lie under the bar.
  The render scrolls the item in the DetailFrame body and cuts it at the
  top of the tab bar, so `writing-reviewer`, `until pass` and `8` are not
  seen, as in Figma, and the rule check reports the scrolling body as
  `hiddenOverflow`. Step 7's title and line show above the bar, as in
  Figma. A shared app-frame change will let the phone's scroll body run
  under the tab bar; DetailFrame and ScrollFrame stay as they are here. It
  is not an exception.
- **Item tabs.** The selected tab (How it works) is white where Figma's is
  cyan (gap: Item tab selected tone). `ItemTabs` pads its list 2 and each
  tab 12, where Figma's tabs are 10 in with no list padding, so the row is
  wider and Evals is cut at the screen's edge (`Evals` not visible; the
  list's sideways scroll is the second `hiddenOverflow`, which Figma's row
  has too, with Activity past the edge). Gap: Item tab spacing.
- **Discuss button.** Figma's Discuss is an icon button 36 × 28; an
  icon-only `Button` is square, so Discuss is `sm`, 28 × 28, and starts
  6 px further right (`button · Discuss` x +6, w -8). Show on map is
  36 × 36, as in Figma. The icons are 16 px against Figma's 14 and 17.
  Gap: Item action buttons.
- **Item frame.** Figma's `toolkit` (461:404) holds the back row and the
  item, from y 42 down past the tab bar. In `DetailFrame` the back row is
  the ScrollFrame's header and the item is the body under it, so the
  article starts under the back row (`toolkit` y +36, h +23). This is the
  d-107 structure that keeps Back in view, as on M02 and T10.
- **Trigger.** Figma's trigger is 31 high, its text 7 px from the top and
  foot. `Panel variant="notice" tone="done"` pads it 10/12, so it is 38
  high (`trigger` h +7); the steps start a few px under it, so they stay in
  place (gap: How it works trigger).
- **Chat path.** On the 366 px item `ChatPath` wraps its pills to more
  space than Figma's: it is 374 high against 315 (`chat path` h +59). It
  starts in place, and all of it lies under the tab bar (gap: How it works
  steps).
- **Step cards.** As on T10: a card with no uses is 60 high against 61,
  and one with uses 86 against 88 (the chips are 22 high against 23); the
  arrow rows are 16 high against 14, so each card stays within 2 px of
  Figma's. The chips' text is white where Figma colours it as the step's
  kind (gap: How it works use chip). The step numbers are
  `Badge variant="outline"`, 22 high against 19.
- **Back row.** Toolkit and its chevron are `BackRow`'s: `labelLg` and an
  18 px chevron, where Figma has label text and 16 px (gap: Item
  breadcrumb). The row passes the position check.
- **Tab bar.** The shared `AppTabBar` passes the position check, and its
  five items line up with Figma's.
