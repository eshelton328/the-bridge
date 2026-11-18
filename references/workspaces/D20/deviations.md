# D20 deviations

What still differs from Figma after the build of the moved chat
(`pnpm fidelity workspaces D20`, 2026-11-17, library 1.0.0-beta.20), each
with its reason. The library gaps are in
`web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is D2b's sidebar
layout without the side chat and the menu: bridge themes and its subtask
chat theme tokens at the top of THE-BRIDGE (3), OMNI-BRAIN (2) with drift
check and brain git, bridge themes selected and shown alone, Working, its
header naming the-bridge, and the toast "Moved bridge themes to the-bridge"
with Undo over the composer (`movedChat`).

## Checks

- Text: pass. Every Figma string shows, `Moved bridge themes to the-bridge`
  and `Undo` included. `Artifacts` and `Toolkit` (rail, d-105) are
  excepted as on D01 to D19.
- Position: 22 of 28 layers pass; `417:2092`, `toast · moved` and
  `417:2105` fail. Every sidebar row and group header, the chat header
  (`417:2059`), the ⋯ (`417:2070`) and Erik's message (`417:2087`) pass.
  The shared navigation's items pass too: `rail · Inbox`,
  `rail · Workspaces` and `rail · Projects`.
- Rules: pass.

## Deviations

- **Toast is smaller (Toast size).** `toast · moved` x +23, w -48: the
  library's `Toast` writes its message and Undo in small text (12 px) with
  12 px side padding and an 8 px gap, so it is 258 × 38 against Figma's
  306 × 40 (14 px text, 17 px sides, 16 px gap). It is centred over the
  composer as in Figma, with the accent border, and its bottom is at
  Figma's place (y +2).
- **Toast and composer gap.** Figma's toast touches the composer's top;
  the toast sits in `ChatPane`'s `above` slot, 12 px over the composer,
  which is itself 12 px lower than Figma's (next item), so the toast keeps
  Figma's place on the screen.
- **Main chat reply (Message text).** `417:2092` h +7: the reply wraps in
  body text (14/20) and Copy is 24 px (Figma 22), as on D01 to D19.
- **Composer is lower.** `417:2105` y +12, h +7: Figma's D20 puts the
  composer 35 px above the bottom, where D2b put it 16 above; the shared
  `ChatPane` keeps D2b's place (as on D15 to D19). Its height is
  `Composer`'s attachment chip, 20 px text line and 28 px buttons, 7 px
  taller than Figma's, as on D02b and D15 to D19.
- **Chat header and group headers (Chat header, Sidebar group header).**
  As on D02b and D16 to D19: the ⋯ is a `Button size="xs"` (24 px) against
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
- **Stop is wider (Composer text).** `Composer` draws Stop as
  `Button size="sm"`, a 14 px label with a 16 px icon, about 9 px wider
  than Figma's 58 px button with an 11 px label and a 12 px icon
  (417:2127).
- **Group header icons (Sidebar group header).** Figma's rename and
  close on the OMNI header (D21 417:2326, 417:2329) are 13 px outline
  icons with a 2 px stroke, so they look heavy; `EditIcon` and
  `CloseIcon` at 12 px draw a 1 px stroke, and no icon takes a stroke
  weight.
- **Nav rail.** Figma's rail has no Artifacts or Toolkit item, so
  `rail · Artifacts` and `rail · Toolkit` have no layer, and
  `rail · More` sits 108 px lower (y +108). The design predates d-105,
  which adds the Toolkit (and Artifacts) item; the app draws the
  six-item navigation.
