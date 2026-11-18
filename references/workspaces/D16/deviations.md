# D16 deviations

What still differs from Figma after the first build of the forked chat
(`pnpm fidelity workspaces D16`, 2026-11-17, library 1.0.0-beta.20), each
with its reason. The library gaps are in
`web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is D2b's sidebar
layout without the side chat and the menu: the fork, bridge themes · fork,
listed under bridge themes with the branch mark, selected and shown alone,
Idle, with the fork line under the copied messages (`forkedChat`).

## Checks

- Text: pass. Every Figma string shows, `omni-brain · forked from bridge
  themes` and `Forked from bridge themes here · the messages above are a
  copy` included. `Artifacts` and `Toolkit` (rail, d-105) are excepted as
  on D01 to D15.
- Position: 18 of 22 layers pass; `417:568`, `417:603`, `417:654` and
  `417:667` fail. The fork's row (`417:697`), the chat header (`417:621`)
  and Erik's message (`417:649`) pass.
- Rules: pass.

## Deviations

- **omni and skill-evals headers sit lower (Sidebar group header, Sidebar
  chat row).** `417:568` y +6 and `417:603` y +6 (h +2 each): each sidebar
  row is 52 px against Figma's 50, and each group header 30 against 28, so
  the sidebar drifts 2 px a part. D15 has the same parts and one row less,
  so its headers stayed within the 4 px tolerance; the fork row adds the
  2 px that pass it.
- **Main chat reply.** `417:654` h +7: the reply wraps in body text
  (14/20) and Copy is 24 px (Figma 22), as on D01 to D15 (Message text).
- **Composer is lower.** `417:667` y +14, h +7: Figma's D16 puts the
  composer 37 px above the bottom, where D2b put it 16 above; the shared
  `ChatPane` keeps D2b's place (as on D15). Its height is `Composer`'s
  attachment chip, 20 px text line and 28 px buttons, 7 px taller than
  Figma's, as on D02b and D15.
- **Fork mark (Nested row mark).** Figma draws only the branch mark
  (13 px) before the fork's kind mark. `ListRow` draws a ↳ before every
  nested row, so the render shows the ↳ and then a 12 px branch mark, about
  5 px right of Figma's; the kind mark and the title are where Figma has
  them.
- **Fork line.** The line "Forked from bridge themes here · the messages
  above are a copy" is the library's `ToolLine` (green dot, mono text), as
  Figma draws it; it is not measured, as the tool line above it is not.
- **Chat header and group headers (Chat header, Sidebar group header).**
  As on D02b and D15: the ⋯ is a `Button size="xs"` (24 px) against
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
- **Rail.** The shared `AppRail` adds Artifacts and Toolkit before More
  (d-105), so More sits lower than Figma's.
