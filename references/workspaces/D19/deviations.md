# D19 deviations

What still differs from Figma after the build of Move to workspace
(`pnpm fidelity workspaces D19`, 2026-11-17, library 1.0.0-beta.20), each
with its reason. The library gaps are in
`web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is D2b's sidebar
layout without the side chat: the ⋯ of bridge themes pressed, its menu
open with Move to workspace highlighted, and Move to workspace's list
(the-bridge highlighted, omni, skill-evals, then New workspace…) open to
the left of the menu (`moveToWorkspace`).

## Checks

- Text: pass. Every Figma string shows, the list's `the-bridge`, `omni`,
  `skill-evals` and `New workspace…` included. `Artifacts` and `Toolkit`
  (rail, d-105) are excepted as on D01 to D18.
- Position: 23 of 28 layers pass; `417:1697` and `417:1710` fail. The
  chat actions menu (`417:1740`), the ⋯ (`417:1675`), the chat header
  (`417:1664`), Erik's message (`417:1692`) and every sidebar row and
  group header pass.
  The shared navigation's items pass too: `rail · Inbox`,
  `rail · Workspaces` and `rail · Projects`.
- Rules: pass.

## Deviations

- **Main chat reply (Message text).** `417:1697` h +7: the reply wraps in
  body text (14/20) and Copy is 24 px (Figma 22), as on D01 to D18.
- **Composer is lower.** `417:1710` y +12, h +7: Figma's D19 puts the
  composer 35 px above the bottom, where D2b put it 16 above; the shared
  `ChatPane` keeps D2b's place (as on D15 to D18). Its height is
  `Composer`'s attachment chip, 20 px text line and 28 px buttons, 7 px
  taller than Figma's, as on D02b and D15 to D18.
- **Move to workspace list sits lower (Submenu offset, Submenu data
  attributes).** Figma puts the list's top 7 px above Move to workspace,
  so the-bridge lines up with that row; `MenuSubmenu` places the list
  itself and takes no offset, so it shows about 12 px lower. It opens to
  the left of the menu, 200 wide, as in Figma. Its box takes no
  `data-figma`, so the position check does not measure `417:1799`.
- **Menu icons (Menu icon size).** The menu and list icons are 16 px
  (Figma 14) and drawn in `fg.muted`, where Figma draws them lighter; the
  highlighted rows' icons are in the accent colour, as in Figma.
- **Open ⋯ draws the open trigger border (border rule).** Figma draws
  the ⋯ (`417:1675`) with `border.default` while its menu is open. The
  border rule for every page says a trigger that opens a menu, popover
  or sheet draws `border.active` while open, so the ⋯ is the pressed
  chip with the cyan border. Figma is not consistent here: D02b's open ⋯
  is cyan, so D19's plain chip counts as a Figma inconsistency.
- **Chat header and group headers (Chat header, Sidebar group header).**
  As on D02b and D18: the ⋯ is a `Button size="xs"` (24 px) against
  30 × 22, and the group header buttons are 24 px with 12 px icons.
- **Attachment remove × (Composer attachment remove).** Figma's × on
  theme-ideas.md is bold; `Composer` draws its own thin `CloseIcon`.
- **Main pane text is a little larger (Chat header text, Composer text,
  Message text).** The chat title is `subtitle` (SemiBold 17) against
  Figma's SemiBold 16 (D19 417:1669), the composer's placeholder `body`
  (14) against Regular 13 (D19 417:1719), and Erik's message `body` (14/20)
  against `bodySm` (13/20), so each runs about 7 to 8% wider than
  Figma's. No text style is SemiBold 16, and `Composer` and `Message`
  take no text size. The workspace line and "context" under the title
  are `monoSm` and `smallXs`, as Figma's (D19 417:1670, 417:1689).
- **Nav rail.** Figma's rail has no Artifacts or Toolkit item, so
  `rail · Artifacts` and `rail · Toolkit` have no layer, and
  `rail · More` sits 108 px lower (y +108). The design predates d-105,
  which adds the Toolkit (and Artifacts) item; the app draws the
  six-item navigation.
- **Menu surface (2026-11-18).** Library beta.45 gives the `Menu`
  content the `blurs.glass` backdrop blur, as Figma's chat actions menu
  (417:1740) has, so Claude's reply under the menu no longer shows through it.

## Settings gear (d-119)

In the app, the rail has a Settings gear before More, which this frame
does not draw: Settings has no Figma page, and decision d-119 puts its
entry in the rail (`web/src/blocks/AppRail.tsx`). The Notifications
switch that d-118 put at the rail's end moved to the Settings page, so
the rail no longer draws it.
