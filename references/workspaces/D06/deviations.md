# D06 deviations

What still differs from Figma after the first build of the drop zone
(`pnpm fidelity workspaces`, 2026-11-17, against the library's
1.0.0-beta.18), each with its reason. The library gaps are
in `web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is D02b's
without the open menu and the side chat: hono server is dragged from the
sidebar onto bridge themes, its row fades, and the right half of the chat
is the drop zone (`ui.paneDrag`, edge `right`).

## Checks

- Text: pass. `ContextMeter` draws each percentage as one text node, so
  `26%`, `42%`, `23%` and `18%` pass, and both of Figma's `78%`, in the
  hono server row (158:760) and the dragged chat (158:1044), show in
  full. `Artifacts` and `Toolkit` (rail, d-105) are excepted as on D01
  to D05.
- Position: 23 of 30 layers pass; `158:919`, `158:934`, `158:1048` and
  `158:1034` fail.
  The shared navigation's items pass too: `rail · Inbox`,
  `rail · Workspaces` and `rail · Projects`.
- Rules: pass.

## Deviations

- **Text sizes (Message text).** Figma draws Erik's message in 13/19 and
  an agent's name in SemiBold 12 (D08 402:1066, 402:1072). The library's
  `Message` draws `body` (14/20) and `label` (14/500) and takes no text
  size, so both are about one size larger than Figma's (fidelity review
  D08 F2, F4).
- **Dragged chat in the drop zone (Drop zone).** `158:1034` x +37,
  y -71, w +8: Figma draws the chat where the pointer holds it, 111 under
  the hint and 75 in from the zone's left edge. The largest spacing token
  is 40, so the chat sits 40 under the hint, centred in the zone (d-100).
  It is 320 wide (`shell.popover`, the nearest width token to Figma's 310).
  It is `DragPreview` around the chat's row: a cyan border and a shadow,
  as Figma draws it.
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
- **Group header icons (Sidebar group header).** The ⋯, rename and close
  buttons are 24 px (`Button size="xs"`) with 12 px icons, against Figma's
  14 px icons with no button box, as on D02b. They are drawn in `fg.muted`,
  Figma's grey.
- **Chat actions button (Chat header).** The ⋯ is a `Button size="xs"`,
  24 px high against Figma's 30 × 22, as on D02b.
- **Nav rail.** Figma's rail has no Artifacts or Toolkit item, so
  `rail · Artifacts` and `rail · Toolkit` have no layer, and
  `rail · More` sits 108 px lower (y +108). The design predates d-105,
  which adds the Toolkit (and Artifacts) item; the app draws the
  six-item navigation.
