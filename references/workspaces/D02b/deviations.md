# D02b deviations

What still differs from Figma after the first build of the chat actions
menu (`pnpm fidelity workspaces`, 2026-11-17, after the move to the
library's 1.0.0-beta.15), each with its reason. The library gaps are
in `web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is D02's without
the drag, with the ⋯ of the chat header pressed and its menu open.

## Checks

- Text: fails on one percentage, `78%` (402:5289): the hono server row's
  meta is cut 2 px short (see `hiddenOverflow` below). The other
  percentages (`26%`, `42%`, `23%`, `18%`) pass without an exception:
  `ContextMeter` draws each as one text node. `Artifacts` and `Toolkit`
  (rail, d-105) are excepted as on D01.
- Position: 23 of 27 layers pass; `402:5390`, `402:5403`, `402:5441` and
  `402:5443` fail.
- Rules: `hiddenOverflow` on the hono server row's meta line (402:5279).

## Deviations

- **Chat actions menu (Menu icon size).** `402:5486` passes:
  `density="compact"` puts the rows edge to edge, as Figma's. Its icons
  are 16 px (Figma 14), as in the pane menu of D01. The menu is 240 wide
  (`width="sm"`) and opens under the ⋯ at its right edge, as in Figma.
  The Subagents icon is `fg.accent`, as Figma draws it; the other icons
  are the menu's `fg.muted`.
- **Highlighted row.** The state highlights Move to workspace
  (`highlightedValue`), and `density="compact"` draws its icon in the
  accent colour, as Figma does.
- **Chat actions button (Chat header).** The ⋯ is a pressed
  `Button size="xs"`, 24 px high against Figma's 30 × 22.
- **Context meter in sidebar rows (Sidebar chat row).** `hiddenOverflow`
  on 402:5279: the hono server row's meta ("Sonnet 5.5" and "78%") is
  152 px in a 150 px column beside its `Needs you` pill, so the end of
  "78%" is cut 2 px, as on D02.
- **Main chat.** `402:5390` h +8: the reply wraps in body text (14/20) and
  Copy is 24 px (Figma 22), as on D01 and D02. `402:5403` y -7, h +7: the
  attachment chip, the 20 px text line and the 28 px buttons of `Composer`
  are taller than Figma's, as on D02.
- **Attachment remove × (Composer attachment remove).** Figma's × on the
  attached file is bold; `Composer` draws its own thin `CloseIcon`, in the
  same `fg.muted`.
- **Side chat.** `402:5441` h +21 and `402:5443` y +22: "Can Panda CSS
  switch themes while the app runs?" wraps to two lines in the render; the
  line is 1 px wider than the bubble's 321 px, as on D02.
- **Group header icons (Sidebar group header).** The ⋯, rename and close
  buttons are 24 px (`Button size="xs"`) with 12 px icons, against Figma's
  14 px icons with no button box, as on D02. They are drawn in `fg.muted`,
  Figma's grey.
- **Rail.** The shared `AppRail` adds Artifacts and Toolkit before More
  (d-105), so More sits lower than Figma's.
- **Figma layers.** Each sidebar block takes the frame's layer ids from the
  state's `data.layers` (D02b's node ids differ from D02's) and keeps D02's
  when a state sets none. This changes no pixel.
