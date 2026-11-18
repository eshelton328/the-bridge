# D18 deviations

What still differs from Figma after the build of the running subtask
(`pnpm fidelity workspaces D18`, 2026-11-17, library 1.0.0-beta.20), each
with its reason. The library gaps are in
`web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is D2b's sidebar
layout without the side chat and the menu: the subtask layout notes listed
under bridge themes as a nested row after theme tokens, Running, and
bridge themes selected and shown alone, Working, with the line where the
subtask started under its reply (`subtaskRunning`).

## Checks

- Text: pass. Every Figma string shows, `layout notes`, `4%` and
  `Subtask layout notes started · returns its result here` included.
  `Artifacts` and `Toolkit` (rail, d-105) are excepted as on D01 to D17.
- Position: 22 of 26 layers pass; `417:1289`, `417:1324`, `417:1375` and
  `417:1388` fail. The subtask's row (`417:1418`), the chat header
  (`417:1342`) and Erik's message (`417:1370`) pass.
- Rules: pass.

## Deviations

- **omni and skill-evals headers sit lower (Sidebar group header, Sidebar
  chat row).** `417:1289` y +6 and `417:1324` y +6 (h +2 each): each
  sidebar row is 52 px against Figma's 50, and each group header 30
  against 28, so the sidebar drifts 2 px a part. The subtask row adds the
  2 px that pass the 4 px tolerance, as the fork row does on D16.
- **Main chat reply (Message text).** `417:1375` h +7: the reply wraps in
  body text (14/20) and Copy is 24 px (Figma 22), as on D01 to D17.
- **Composer is lower.** `417:1388` y +14, h +7: Figma's D18 puts the
  composer 37 px above the bottom, where D2b put it 16 above; the shared
  `ChatPane` keeps D2b's place (as on D15 and D16). Its height is
  `Composer`'s attachment chip, 20 px text line and 28 px buttons, 7 px
  taller than Figma's, as on D02b, D15 and D16.
- **Subtask line.** "Subtask layout notes started · returns its result
  here" is the library's `ToolLine` (green dot, mono text), as Figma draws
  it; it is not measured, as the tool line above it is not.
- **Chat header and group headers (Chat header, Sidebar group header).**
  As on D02b and D16: the ⋯ is a `Button size="xs"` (24 px) against
  30 × 22, and the group header buttons are 24 px with 12 px icons.
- **Attachment remove × (Composer attachment remove).** Figma's × on
  theme-ideas.md is bold; `Composer` draws its own thin `CloseIcon`.
- **Rail.** The shared `AppRail` adds Artifacts and Toolkit before More
  (d-105), so More sits lower than Figma's.
