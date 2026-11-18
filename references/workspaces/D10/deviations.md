# D10 deviations

What still differs from Figma after the build of a third chat dragged
below a pane (`pnpm fidelity workspaces`, 2026-11-17, against the
library's 1.0.0-beta.16; measured on 1.0.0-beta.20), each with its reason. The library gaps are in
`web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is D09's: the
sidebar beside the workbench, with bridge themes and drift check side by
side. Erik drags brain git from the sidebar near the bottom edge of drift
check (`ui.paneDrag`, edge `bottom`, pane `drift-check`): its row fades,
and the lower half of drift check alone is the drop zone
(`PaneDropZone placement="pane"`), with the title, one line, no icon and
no hint, and the dragged chat in `DragPreview`. Bridge themes keeps its
full height. No block changed: the zone is an overlay of the pane that
`ui.paneDrag.pane` names, so the split model stays general for D11 to D14.

## Checks

- Text: pass. Every string passes, the drop zone's two lines, the dragged
  chat's `brain git`, `shell · zsh` and `Idle` and the hono server row's
  `78%` (402:3284) included. `Artifacts` and `Toolkit` (rail, d-105) are
  excepted as on D01 to D09.
- Position: 15 of 25 layers pass; `402:3497`, `402:3512`, `402:3537`,
  `402:3542`, `402:3555`, `402:3583`, `402:3612`, `402:3625`, `402:3637`
  and `402:3651` fail. The panes' x and width, and the zone's x and width,
  match Figma's within 2 px.
- Rules: pass.
- Earlier frames: `pnpm fidelity workspaces` on 1.0.0-beta.20 gives the
  results their own deviations.md files list (D01 9 of 17, D02 22 of 27,
  D02b 23 of 27, D03 24 of 43, D04 16 of 35, D05 8 of 21, D06 20 of 24,
  D07 15 of 20, D08 15 of 22, D09 15 of 23 layers pass, with the same text
  and rule results). None got worse than on 1.0.0-beta.16.

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
- **Tab bar (Workbench tab bar).** `402:3497` x +34.7: the four tabs are
  35 px wider than Figma's together, so New chat sits 35 px further
  right, as on D07 to D09.
- **Panes (Workbench tab bar).** `402:3512` y -10, h +8 and `402:3583`
  y -10, h +8: `compact` starts the panes right under the 52 px bar,
  where Figma pads them 10, as on D07 to D09. Their x and width match.
- **Drop zone box (Drop zone).** `402:3637` y -6: the zone is 4 in from
  drift check's left, right and bottom and starts 4 past its middle, as
  Figma draws it (507 in a pane from 62 to 944), so it moves up with the
  pane above, by half of the pane's 10 and 8. Its x, width and height
  match. The dashes are a CSS dashed border of `border.active` at
  `borderWidths.ring` (2 px), as on D06 and D08; the browser draws them a
  little shorter than Figma's. The title and the line are within the
  tolerance.
- **Dragged chat (Drag preview, Drop zone).** `402:3651` x +5, y -3.3,
  w +6.4, h -10.1: Figma turns the chat 3°, so its box (292 × 62) is the
  turned copy's bounds; the render keeps `DragPreview`'s `tilt` off,
  because the text check measures a turned row against its unturned box.
  Unturned, Figma's chat is about 289 × 47; it is 300 wide in the render
  (`shell.popoverFilter`, d-100, as on D08) and 52 high. It sits 20 in
  from the zone's end, as on D08, where Figma's pointer holds it about 34
  in, so it is 5 px further right. Its place under the text matches
  Figma's (about 289 under the zone's top, Figma 287); the y -3.3 is the
  zone's move with the pane.
- **Drop zone title (Drop zone).** Figma's title (402:3638) is SemiBold
  16; no text style is 16/600, so the render uses `labelLg` (16/500), as
  on D08 and D12.
- **Transcript.** `402:3537` y -6.5 and `402:3542` y -5.5, h +8: bridge
  themes' entries move up with the pane; the reply wraps in body text
  (14/20), and Copy is 24 px (Figma 22), as on D07 to D09. `402:3612`
  y -6, h +6: drift check's approval moves up with its pane, and its
  h +6 comes from `ProposalBlock`'s padding and its 28 px buttons, as on
  D01 (105:291) and D09.
- **Composers.** `402:3555` y -8.5, h +7: the attachment chip, the 20 px
  text line and the 28 px buttons of `Composer` are taller than Figma's,
  as on D07 to D09. `402:3625` y -5: drift check's composer moves up with
  its pane. Figma draws a caret after "/"; the story does not focus the
  box. The composers keep the layout of the earlier frames (d-107).
- **Attachment remove × (Composer attachment remove).** Figma's × on the
  attached file is bold; `Composer` draws its own thin `CloseIcon`.
- **Faded row.** The brain git row fades with `opacity.disabled` (0.45),
  as drift check's does on D08 (d-100).
- **Group header icons (Sidebar group header).** The ⋯, rename and close
  buttons are 24 px (`Button size="xs"`) with 12 px icons, against
  Figma's 14 px icons with no button box, as on D07 to D09.
- **Rail.** The shared `AppRail` adds Artifacts and Toolkit before More
  (d-105), so More sits lower than Figma's.

## Value picks (d-100)

None new: the zone's 4 px inset, the dragged chat's width (300), its
inset from the zone's end (20) and its 1 : 2 place in the room under the
text are D08's picks.
