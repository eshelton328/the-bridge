# M27 deviations

What still differs from Figma after the fidelity loop
(`pnpm fidelity toolkit M27`, 2026-11-18, against library 1.0.0-beta.36:
a first run and three fix rounds), each with its reason. The library
gaps are in `web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/ruleEvalsPhone.ts`: T24's data; the rule
keeps M19's header. Every other Toolkit frame (M01, M02, M04 to M06,
M08, M09, M11, M12, M17, M19 to M22 and M31 to M41 and the list frames)
gives the same text, position and rule results as before the Evals tab.
The frame has no `exceptions.json`.

## Checks

- Text: pass. Every Figma string is in the render and visible, and
  nothing extra shows.
- Position: 19 of 21 layers pass. The 2 that fail: `button · Discuss` x
  +8 w -8; `toolkit` y +36 h -173. Each is explained below.
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
- **Ledger rows.** Each ledger's name (writer, ambitious, agents-md,
  readme) is a plain button in the label style that opens the skill:
  writer on its Evals tab (D20), the others on their Overview. The
  library has no round row and no text link at this size, so the rows
  are styled with tokens (gap: Evals panels). The count 4 ledgers is
  accent text with no tap.
