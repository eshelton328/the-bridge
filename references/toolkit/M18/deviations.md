# M18 deviations

What still differs from Figma after the fidelity loop
(`pnpm fidelity toolkit M18`, 2026-11-18, against library 1.0.0-beta.36:
a first run and three fix rounds), each with its reason. The library
gaps are in `web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/skillEvalsPhone.ts`: T16's data with the
phone's status header (V1 done criteria, x1, Codex grader); the back row
names the item and the title sits over the tabs, as on M12 and M17.
Every other Toolkit frame (M01, M02, M04 to M06, M08, M09, M11, M12,
M17, M19 to M22 and M31 to M41 and the list frames) gives the same text,
position and rule results as before the Evals tab. The frame has no
`exceptions.json`.

## Checks

- Text: fail. Every Figma string is in the render and nothing extra
  shows. One string is not visible: `x1` (482:2624), the last group of
  the chart, which scrolls sideways; see Chart size.
- Position: 24 of 33 layers pass. The 9 that fail: `button · Discuss` x
  +6 w -8; `toolkit` y +36 h +250; `evals` y +1 h -12; `badge · D6` x
  +0.1 w -7.6 h -1; `chart` y -3 w +24 h +25; `panel · rounds` y -5 h
  -4; `round · r7` y -6 h -2; `round · x1` y -6 h -2; `round · r6` y -8
  h -1. Each is explained below.
- Rules: fail. 3 `hiddenOverflow` findings:
  `div.backdrop > div.app-shell__root > main.app-shell__detail > div.scroll-frame__root > div.scroll-frame__body:nth-of-type(2)`;
  `[data-figma="toolkit"] > div.item-tabs__root > div.item-tabs__list:nth-of-type(1)`;
  `[data-figma="chart"] > div.grouped-bar-chart__root`. Each is
  explained below; this frame takes no exceptions.

## Deviations

- **Discuss button.** As on M19: an icon-only `Button` is square, so
  Discuss is `sm`, 28 × 28, against Figma's 36 × 28, and starts further
  right (`button · Discuss` x +6 w -8; gap: Item action buttons).
- **Item frame.** Figma's `toolkit` holds the back row and the item,
  from y 42 down to the tab bar at y 767. In `DetailFrame` the back row
  is the ScrollFrame's header and the item is the body under it, so the
  article starts under the back row and runs to the tab's source line
  (`toolkit` y +36 h +250), as on M19 (d-107).
- **Under the tab bar.** Figma draws the tab past the tab bar at y 767;
  the tab bar lies over the page (AppShell `tabBarOverlay`), so the
  tab's foot lies under the bar in the render too, and the item's
  ScrollFrame body scrolls: the `hiddenOverflow` finding
  `div.backdrop > div.app-shell__root > main.app-shell__detail > div.scroll-frame__root > div.scroll-frame__body:nth-of-type(2)`,
  as on M17 and M20.
- **Item tabs.** As on M17: Evals ends inside the screen and only
  Activity runs past it, as in Figma; the list's sideways scroll is the
  `hiddenOverflow` finding
  `[data-figma="toolkit"] > div.item-tabs__root > div.item-tabs__list:nth-of-type(1)`.
  The outline stays `border.selected` at half alpha (d-050).
- **Line heights.** The tab's headers, its small and mono lines and its
  rows are 16 px high in the `monoCaps`, `small` and `mono` text styles
  against Figma's 17: the library keeps line heights on the 4 px grid
  (d-072). The rows sit 8 and 10 apart in turn to keep Figma's 25 and 47
  px steps on average, and the lines under the badges, the chart and the
  cases 2 px lower, so most rows stay within the tolerance; what remains
  adds up down the tab: `evals` y +1 h -12; `panel · rounds` y -5 h -4;
  `round · r7` y -6 h -2; `round · x1` y -6 h -2; `round · r6` y -8 h -1
  (gap: Evals panels).
- **Chart size.** Figma draws 12 px bars with a group every 44 px in 308
  px (482:2602); `GroupedBarChart` has one size, 16 px bars every 56 px,
  so the chart is 392 wide in a panel 332 wide inside and scrolls
  sideways (`chart` y -3 w +24 h +25, its box held at the panel's width,
  and 135 high with its axis inside against 110). r6 is cut at the
  panel's edge and x1 lies past it, so `x1` is not visible, and the
  chart's scroll is the `hiddenOverflow` finding
  `[data-figma="chart"] > div.grouped-bar-chart__root` (gap: Evals bar
  chart).
- **Badges.** The criteria are the library's `Badge size="sm"`, each 2
  px wider than Figma's, so they sit 4 apart against Figma's 6 and each
  stays at Figma's x. The checks and the cross are the library's 12 px
  `CheckIcon` and `CloseCircleIcon` against Figma's 11. The waiting
  criterion D6 Real use · waits has its label in the badge's one style,
  112 × 20, where Figma draws it in a larger style, 120 × 21
  (`badge · D6` x +0.1 w -7.6 h -1; gap: Evals criterion badge).
- **Open the ledger.** Figma draws Open the ledger in the accent colour.
  The ledger is in projects/skill-evals/, outside the toolkit, and no
  frame draws it, so the render keeps the link disabled and muted, with
  a title that says so (gap: Evals panels).
- **D5 Reviewer.** The badge opens the agent writing-reviewer on its
  Evals tab (D26; T25 on a tablet). `Badge` takes no press, so it sits
  in a plain button styled with tokens, which draws nothing of its own
  (gap: Evals panels).
