# D02b deviations

What still differs from Figma after the first build of the chat actions
menu (`pnpm fidelity workspaces D02b`, 2026-11-17, fix round 2, against the
installed library 1.0.0-beta.9), each with its reason. The library gaps are
in `web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is D02's without
the drag, with the ⋯ of the chat header pressed and its menu open.

## Checks

- Text: fails on two percentages.
  - `26%` (402:5230) and `78%` (402:5289): the library's `ContextMeter`
    draws the number and "%" as two text nodes, and both metas are also
    clipped in the render (see `hiddenOverflow` below), so they are real
    differences.
  - `42%` (402:5215, 402:5381), `23%` (402:5246) and `18%` (402:5335) show
    in full; `exceptions.json` excepts them (ContextMeter percentage).
    `Artifacts` and `Toolkit` (rail, d-105) are excepted as on D01.
- Position: 22 of 27 layers pass; `402:5390`, `402:5403`, `402:5441`,
  `402:5443` and `402:5486` fail.
- Rules: `hiddenOverflow` on two row meta lines (theme tokens 402:5219 and
  hono server 402:5279).
- D01 and D02 give the same report as before this build
  (`pnpm fidelity workspaces D01 D02 --skip-build`): neither got worse.

## Deviations

- **Chat actions menu (Menu row pitch).** `402:5486` h +16: `Menu` rows
  are 32 px and 2 px apart, where Figma's are 31 px and 1 px apart, so the
  eight rows make the menu 295 high against 279. Its icons are 16 px
  (Figma 14), as in the pane menu of D01. The menu is 240 wide
  (`width="sm"`) and opens under the ⋯ at its right edge, as in Figma.
- **Highlighted row (Menu highlighted row).** Figma fills Move to
  workspace and colours its icon cyan; `Menu` fills only the row under the
  pointer or the focus, so no row is filled.
- **Chat actions button (Chat header).** The ⋯ is a pressed
  `Button size="xs"`, 24 px high against Figma's 30 × 22.
- **Context meter in sidebar rows (Sidebar chat row).** `hiddenOverflow`
  on 402:5219 (4 px) and 402:5279 (6 px): the end of "26%" and "78%" is
  cut off, because the library's `ContextMeter` is about 5 px wider than
  Figma's 83, as on D02.
- **Main chat.** `402:5390` h +8: the reply wraps in body text (14/20) and
  Copy is 24 px (Figma 22), as on D01 and D02. `402:5403` y -7, h +7: the
  attachment chip, the 20 px text line and the 28 px buttons of `Composer`
  are taller than Figma's, as on D02.
- **Side chat.** `402:5441` h +21 and `402:5443` y +22: "Can Panda CSS
  switch themes while the app runs?" wraps to two lines in the render; the
  line is 1 px wider than the bubble's 321 px, as on D02.
- **Group header icons (Sidebar group header).** The ⋯, rename and close
  buttons are 24 px (`Button size="xs"`) with 12 px icons, against Figma's
  14 px icons with no button box, as on D02.
- **Rail.** The shared `AppRail` adds Artifacts and Toolkit before More
  (d-105), so More sits lower than Figma's.
- **Figma layers.** Each sidebar block takes the frame's layer ids from the
  state's `data.layers` (D02b's node ids differ from D02's) and keeps D02's
  when a state sets none. This changes no pixel.
