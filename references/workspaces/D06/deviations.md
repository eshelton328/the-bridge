# D06 deviations

What still differs from Figma after the first build of the drop zone
(`pnpm fidelity workspaces D06`, 2026-11-17, third run after the first check, against the
installed library 1.0.0-beta.9), each with its reason. The library gaps are
in `web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is D02b's
without the open menu and the side chat: hono server is dragged from the
sidebar onto bridge themes, its row fades, and the right half of the chat
is the drop zone (`ui.paneDrag`, edge `right`).

## Checks

- Text: fails on two percentages.
  - `26%` (204:13) and `78%` (158:760): the library's `ContextMeter`
    draws the number and "%" as two text nodes, and both metas are also
    clipped in the render (see `hiddenOverflow` below), so they are real
    differences.
  - `42%` (158:698, 158:855), `23%` (158:717), `18%` (158:808) and the
    dragged chat's `78%` (158:1044) show in full; `exceptions.json`
    excepts them (ContextMeter percentage). `Artifacts` and `Toolkit`
    (rail, d-105) are excepted as on D01 to D05.
- Position: 20 of 24 layers pass; `158:919`, `158:934`, `158:1048` and
  `158:1034` fail.
- Rules: `hiddenOverflow` on two row meta lines (theme tokens 204:2 and
  hono server 158:750).
- D01, D02, D02b, D03, D04 and D05 give the same report as before this
  build (`pnpm fidelity workspaces D01 D02 D02b D03 D04 D05 --skip-build`):
  none got worse.

## Deviations

- **Dragged chat in the drop zone (Drop zone).** `158:1034` x +36,
  y -72, w +10: Figma draws the chat where the pointer holds it, 111 under
  the hint and 75 in from the zone's left edge. The largest spacing token
  is 40, so the chat sits 40 under the hint, centred in the zone (d-100).
  It is 320 wide (`shell.popover`, the nearest width token to Figma's 310).
  Its border is the row's running border, less bright than Figma's cyan
  border, and it has no shadow.
- **Hint box (Drop zone).** `158:1048` x +13, w -27: the hint is one text
  layer in Figma with wider gaps around the "·"; the render draws the same
  string in `monoSm` with single spaces, so the box is 431 wide against
  458. It is 30 high against 28.
- **Drop zone box (Drop zone).** The dashes are a CSS dashed border of
  `border.active` at `borderWidths.ring` (2 px, d-100); the browser draws
  them a little shorter than Figma's. The split icon is 24 px (the largest
  icon size) against Figma's 28. The zone and its title, line and hint
  are within the tolerance.
- **Faded row.** The hono server row in the sidebar fades with
  `opacity.disabled` (0.45), the nearest opacity token to Figma's look
  (d-100).
- **Main chat.** `158:919` h +7: Copy is 24 px (Figma 22), as on D02b.
  `158:934` y -7, h +7: the attachment chip, the 20 px text line and the
  28 px buttons of `Composer` are taller than Figma's, as on D02 and D02b.
  The composer keeps the layout the earlier frames use (d-107).
- **Context meter in sidebar rows (Sidebar chat row).** `hiddenOverflow`
  on 204:2 (4 px) and 158:750 (6 px): the end of "26%" and "78%" is cut
  off, because the library's `ContextMeter` is about 5 px wider than
  Figma's 83, as on D02 to D04.
- **Group header icons (Sidebar group header).** The ⋯, rename and close
  buttons are 24 px (`Button size="xs"`) with 12 px icons, against Figma's
  14 px icons with no button box, as on D02b.
- **Chat actions button (Chat header).** The ⋯ is a `Button size="xs"`,
  24 px high against Figma's 30 × 22, as on D02b.
- **Rail.** The shared `AppRail` adds Artifacts and Toolkit before More
  (d-105), so More sits lower than Figma's.
