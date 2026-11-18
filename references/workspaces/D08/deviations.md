# D08 deviations

What still differs from Figma after the first build of a chat dragged over
a pane (`pnpm fidelity workspaces`, 2026-11-17, against the library's
1.0.0-beta.16; measured on 1.0.0-beta.20), each with its reason. The library gaps are in
`web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is D07's: the
sidebar beside the workbench, with bridge themes in its one pane. Erik
drags drift check from the sidebar over the right half of the pane
(`ui.paneDrag`, edge `right`, pane `bridge-themes`): its row fades, and
that half is the drop zone (`PaneDropZone placement="pane"`), with the
title, one line, no icon and no hint, and the dragged chat in
`DragPreview`.

## Checks

- Text: pass. Every string passes, the drop zone's two lines and the
  dragged chat's `drift check`, `GPT-5.5`, `23%` and `Needs you` included;
  since 1.0.0-beta.18's smaller `StatusPill` the hono server row's `78%`
  (402:814) fits beside its `Needs you` pill, as on D02b to D07.
  `Artifacts` and `Toolkit` (rail, d-105) are excepted as on D01 to D07.
- Position: 15 of 22 layers pass; `402:1027`, `402:1041`, `402:1066`,
  `402:1071`, `402:1084`, `402:1112` and `402:1126` fail.
- Rules: pass.
- Earlier frames: `pnpm fidelity workspaces` on 1.0.0-beta.20 gives the
  results their own deviations.md files list (D01 9 of 17, D02 22 of 27,
  D02b 23 of 27, D03 24 of 43, D04 16 of 35, D05 8 of 21, D06 20 of 24,
  D07 15 of 20 layers pass, with the same text and rule results). None got
  worse than on 1.0.0-beta.16.

## Deviations

- **Text sizes (Workbench status bar text, Pane header text, Message
  text).** Figma draws the status bar in Geist Mono 11, a pane header's
  title in SemiBold 13 with its model and context in Geist Mono 11, Erik's
  message in 13/19 and an agent's name in SemiBold 12 (D08 402:1033,
  402:1042, 402:1066, 402:1072). The library's `Workbench` status bar
  draws `mono` (12), `Pane` draws `label` (14/500) and `mono` (12), and
  `Message` draws `body` (14/20) and `label` (14/500); none takes a text
  size, so each is about one size larger than Figma's (fidelity review D08
  F1, F2, F4).
- **Tab bar (Workbench tab bar).** `402:1027` x +34.7: the four tabs are
  35 px wider than Figma's together, so New chat sits 35 px further
  right, as on D07.
- **Pane (Workbench tab bar).** `402:1041` y -10, h +8: `compact` starts
  the pane right under the 52 px bar, where Figma pads it 10, as on D07.
- **Drop zone box (Drop zone).** `402:1112` y -10, h +8: the zone is 4 in
  from the pane's top, right and bottom and starts 4 past its middle, as
  Figma draws it, so it moves with the pane above; its x and width match.
  The dashes are a CSS dashed border of `border.active` at
  `borderWidths.ring` (2 px), as on D06; the browser draws them a little
  shorter than Figma's. The title and the line are within the tolerance.
  Figma's title (402:1113) is SemiBold 16; no text style is 16/600, so
  the render uses `labelLg` (16/500), Figma's size (until 2026-11-17
  `paneTitle`, 15/600, about 7% narrower; fidelity review D08 F3).
- **Dragged chat (Drag preview, Drop zone).** `402:1126` w +6.4,
  h -10.1: Figma turns the chat 3°, so its box (292 × 62) is the turned
  copy's bounds; the render keeps `DragPreview`'s `tilt` off, because the
  text check measures a turned row against its unturned box. Unturned,
  Figma's chat is about 289 × 47; it is 300 wide in the render
  (`shell.popoverFilter`, the nearest width token, d-100) and 52 high
  (the sidebar row's 50 and the preview's border). It sits 20 in from the
  zone's end (Figma 26; d-100) and a third of the way down the room under
  the text, as Figma's is (the room is split 1 : 2 around it, so no
  spacing token above 40 is needed); its x and y are within the
  tolerance.
- **Transcript.** `402:1066` y -6.5 and `402:1071` y -5.5, h +7: the
  entries move up with the pane; the reply wraps in body text (14/20), and
  Copy is 24 px (Figma 22), as on D07.
- **Composer.** `402:1084` y -8.5, h +7: the attachment chip, the 20 px
  text line and the 28 px buttons of `Composer` are taller than Figma's,
  as on D07. Figma draws a caret after "/"; the story does not focus the
  box. The composer keeps the layout of the earlier frames (d-107).
- **Attachment remove × (Composer attachment remove).** Figma's × on the
  attached file is bold; `Composer` draws its own thin `CloseIcon`.
- **Faded row.** The drift check row fades with `opacity.disabled`
  (0.45), as hono server's does on D06 (d-100).
- **Group header icons (Sidebar group header).** The ⋯, rename and close
  buttons are 24 px (`Button size="xs"`) with 12 px icons, against
  Figma's 14 px icons with no button box, as on D07.
- **Rail.** The shared `AppRail` adds Artifacts and Toolkit before More
  (d-105), so More sits lower than Figma's.

## Value picks (d-100)

- The dragged chat's width: `shell.popoverFilter` (300), nearest to
  Figma's 289 (`shell.popoverSort` 280 is 9 short, but the turned box the
  check measures is 292).
- Its inset from the zone's end: spacing `20` (Figma 26; 24 would put its
  left edge 8 px off, 20 keeps it within the tolerance).
- Its height in the room under the text: a 1 : 2 split of the free room
  (two flex spacers), which places its top at y 641 where Figma has
  640, with no length value.
- The zone's 4 px inset from the pane: spacing `4`, Figma's value.
- The zone's title: `labelLg` (16/500), Figma's size; no text style is
  16/600 (`paneTitle` is 15/600, `subtitle` 17/600).
