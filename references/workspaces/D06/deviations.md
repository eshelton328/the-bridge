# D06 deviations

What still differs from Figma after the first build of the drop zone
(`pnpm fidelity workspaces`, 2026-11-17, against the library's
1.0.0-beta.15), each with its reason. The library gaps are
in `web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is D02b's
without the open menu and the side chat: hono server is dragged from the
sidebar onto bridge themes, its row fades, and the right half of the chat
is the drop zone (`ui.paneDrag`, edge `right`).

## Checks

- Text: fails on `78%` (158:1044). `ContextMeter` draws each percentage
  as one text node, so `26%`, `42%`, `23%` and `18%` pass. Figma has `78%`
  twice, in the hono server row (158:760) and the dragged chat (158:1044).
  The dragged chat shows it in full, but the hono server row's `78%` is
  cut by 2 px (`hiddenOverflow` below; LIBRARY_GAPS.md row "Sidebar chat
  row"), and the check wants one visible run per layer, so it reports one
  `78%` as not visible. The fix is in the library; there is no exception
  for it. `Artifacts` and `Toolkit` (rail, d-105) are excepted as on D01
  to D05.
- Position: 20 of 24 layers pass; `158:919`, `158:934`, `158:1048` and
  `158:1034` fail.
- Rules: `hiddenOverflow` on the hono server row's meta line (158:750).

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
- **Attachment remove × (Composer attachment remove).** Figma's × on the
  attached file is bold; `Composer` draws its own thin `CloseIcon`, in the
  same `fg.muted`.
- **Context meter in sidebar rows (Sidebar chat row).** `hiddenOverflow`
  on 158:750: the hono server row's meta ("Sonnet 5.5" and "78%") is
  152 px in a 150 px column beside its `Needs you` pill, so the end of
  "78%" is cut 2 px, as on D02 to D04.
- **Group header icons (Sidebar group header).** The ⋯, rename and close
  buttons are 24 px (`Button size="xs"`) with 12 px icons, against Figma's
  14 px icons with no button box, as on D02b. They are drawn in `fg.muted`,
  Figma's grey.
- **Chat actions button (Chat header).** The ⋯ is a `Button size="xs"`,
  24 px high against Figma's 30 × 22, as on D02b.
- **Rail.** The shared `AppRail` adds Artifacts and Toolkit before More
  (d-105), so More sits lower than Figma's.
