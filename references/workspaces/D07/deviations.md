# D07 deviations

What still differs from Figma after the first build of one chat in the
workbench (`pnpm fidelity workspaces D07`, 2026-11-17, second run after the
first check, against the installed library 1.0.0-beta.9), each with its
reason. The library gaps are in `web/src/pages/workspaces/LIBRARY_GAPS.md`.
The screen is D02b's sidebar with no menu open, beside the library's
`Workbench` in place of the chat alone (`ui.workbench`): the workspace tabs
with New chat, one pane (bridge themes, D01's chat with requirements.md
attached and "/" typed) and the status bar ("omni-brain · 1 pane"). The
sidebar has the toggle, so the tab bar has none.

## Checks

- Text: fails on two percentages.
  - `26%` (402:199) and `78%` (402:258): the library's `ContextMeter`
    draws the number and "%" as two text nodes, and both metas are also
    clipped in the render (see `hiddenOverflow` below), so they are real
    differences.
  - `42%` (402:184, 402:494), `23%` (402:215) and `18%` (402:304) show in
    full; `exceptions.json` excepts them (ContextMeter percentage).
    `Artifacts` and `Toolkit` (rail, d-105) are excepted as on D01 to D06.
- Position: 15 of 20 layers pass; `402:471`, `402:485`, `402:510`,
  `402:515` and `402:528` fail.
- Rules: `hiddenOverflow` on two row meta lines (theme tokens 402:188 and
  hono server 402:248).
- D01, D02, D02b, D03, D04, D05 and D06 give the same report as before
  this build (`pnpm fidelity workspaces D01 D02 D02b D03 D04 D05 D06
  --skip-build`): none got worse.

## Deviations

- **Tab bar (Workbench tab bar).** `402:471` x +34.7, y +3, w -2: the
  library's tabs are 32 px (`control.md`) and wider than Figma's 30 px
  tabs, so New chat, a 28 px `Button size="sm"`, sits 35 px further right
  after the four tabs.
- **Pane (Workbench tab bar).** `402:485` y +6, h -8: Figma pads the one
  pane 10 on every side, as the library does, but the taller tab bar
  starts it 6 px lower, and it is 8 px shorter above the status bar.
- **Transcript.** `402:510` y +9.5 and `402:515` y +10.5, h +7: the
  entries move down with the pane and the pane header, as on D01. The reply
  wraps in body text (14/20), and Copy is 24 px (Figma 22).
- **Composer.** `402:528` y -8.5, h +7: the attachment chip, the 20 px
  text line and the 28 px buttons of `Composer` are taller than Figma's,
  as on D01 and D02b. Figma draws the composer focused with a caret after
  "/"; the story does not focus it. The composer keeps the layout the
  earlier frames use (d-107).
- **Context meter in sidebar rows (Sidebar chat row).** `hiddenOverflow`
  on 402:188 (4 px) and 402:248 (6 px): the end of "26%" and "78%" is cut
  off, because the library's `ContextMeter` is about 5 px wider than
  Figma's 83, as on D02 to D06.
- **Group header icons (Sidebar group header).** The ⋯, rename and close
  buttons are 24 px (`Button size="xs"`) with 12 px icons, against Figma's
  14 px icons with no button box, as on D02b. They are drawn in `fg.muted`,
  Figma's grey.
- **Rail.** The shared `AppRail` adds Artifacts and Toolkit before More
  (d-105), so More sits lower than Figma's.

No value in this build needed a d-100 pick: the new parts reuse the
blocks and tokens of D01 and D02b.
