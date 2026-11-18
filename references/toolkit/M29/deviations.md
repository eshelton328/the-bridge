# M29 deviations

What still differs from Figma after the fidelity loop
(`pnpm fidelity toolkit M29`, 2026-11-18, against library 1.0.0-beta.36:
a first run and three fix rounds), each with its reason. The library
gaps are in `web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/workflowEvalsPhone.ts`: T26's data; the
workflow keeps M21's header. Every other Toolkit frame (M01, M02, M04 to
M06, M08, M09, M11, M12, M17, M19 to M22 and M31 to M41 and the list
frames) gives the same text, position and rule results as before the
Evals tab. The frame has no `exceptions.json`.

## Checks

- Text: pass. Every Figma string is in the render and visible, and
  nothing extra shows.
- Position: 15 of 20 layers pass. The 5 that fail: `button · Discuss` x
  +8 w -8; `toolkit` y +36 h -173; `evals` y -1 h -8; `panel · rounds` y
  -2 h -6; `round · After step 6` y -6 h -2. Each is explained below.
- Rules: fail. 1 `hiddenOverflow` finding:
  `[data-figma="toolkit"] > div.item-tabs__root:nth-of-type(3) > div.item-tabs__list:nth-of-type(1)`.
  Each is explained below; this frame takes no exceptions.

## Deviations

- **Discuss button.** As on M19: an icon-only `Button` is square, so
  Discuss is `sm`, 28 × 28, against Figma's 36 × 28, and starts further
  right (`button · Discuss` x +8 w -8; gap: Item action buttons).
- **Item frame.** Figma's `toolkit` holds the back row and the item,
  from y 42 down to the tab bar at y 767. In `DetailFrame` the back row
  is the ScrollFrame's header and the item is the body under it, so the
  article starts under the back row and runs to the tab's source line
  (`toolkit` y +36 h -173), as on M19 (d-107).
- **Item tabs.** As on M17: Evals ends inside the screen and only
  Activity runs past it, as in Figma; the list's sideways scroll is the
  `hiddenOverflow` finding
  `[data-figma="toolkit"] > div.item-tabs__root:nth-of-type(3) > div.item-tabs__list:nth-of-type(1)`.
  The outline stays `border.selected` at half alpha (d-050).
- **Line heights.** The tab's headers, its small and mono lines and its
  rows are 16 px high in the `monoCaps`, `small` and `mono` text styles
  against Figma's 17: the library keeps line heights on the 4 px grid
  (d-072). The rows sit 8 and 10 apart in turn to keep Figma's 25 and 47
  px steps on average, and the lines under the badges, the chart and the
  cases 2 px lower, so most rows stay within the tolerance; what remains
  adds up down the tab: `evals` y -1 h -8; `panel · rounds` y -2 h -6;
  `round · After step 6` y -6 h -2 (gap: Evals panels).
- **from the file.** The link at the gates panel's end is a plain button
  in the small style and the accent colour that opens the workflow's
  Files tab on its design doc (D35); the library has no small text link
  (gap: Evals panels).
