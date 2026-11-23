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
- Position: 21 of 28 layers pass; `417:1289`, `417:1324`, `417:1375` and
  `417:1388` fail. The subtask's row (`417:1418`), the chat header
  (`417:1342`) and Erik's message (`417:1370`) pass.
  The shared navigation's items pass too: `rail · Inbox`,
  `rail · Workspaces` and `rail · Projects`.
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
- **Main pane text is a little larger (Chat header text, Composer text,
  Message text).** The chat title is `subtitle` (SemiBold 17) against
  Figma's SemiBold 16 (D19 417:1669), the composer's placeholder `body`
  (14) against Regular 13 (D19 417:1719), and Erik's message `body` (14/20)
  against `bodySm` (13/20), so each runs about 7 to 8% wider than
  Figma's. No text style is SemiBold 16, and `Composer` and `Message`
  take no text size. The workspace line and "context" under the title
  are `monoSm` and `smallXs`, as Figma's (D19 417:1670, 417:1689).
- **Agent name (Message text).** "Claude" over the reply is `label`
  (14/500) against Figma's SemiBold 12 (`labelXsStrong`); `Message`
  takes no size.
- **Nav rail.** Figma's rail has no Artifacts or Toolkit item, so
  `rail · Artifacts` and `rail · Toolkit` have no layer, and
  `rail · More` sits 108 px lower (y +108). The design predates d-105,
  which adds the Toolkit (and Artifacts) item; the app draws the
  six-item navigation.

## Settings gear (d-119)

In the app, the rail has a Settings gear before More, which this frame
does not draw: Settings has no Figma page, and decision d-119 puts its
entry in the rail (`web/src/blocks/AppRail.tsx`). The Notifications
switch that d-118 put at the rail's end moved to the Settings page, so
the rail no longer draws it.
