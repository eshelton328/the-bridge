# D02b deviations

What still differs from Figma after the first build of the chat actions
menu (`pnpm fidelity workspaces`, 2026-11-17, after the move to the
library's 1.0.0-beta.15; measured on 1.0.0-beta.18), each with its reason. The library gaps are
in `web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is D02's without
the drag, with the ⋯ of the chat header pressed and its menu open.

## Checks

- Text: pass. The percentages (`78%`, `26%`, `42%`, `23%`, `18%`) pass
  without an exception:
  `ContextMeter` draws each as one text node. `Artifacts` and `Toolkit`
  (rail, d-105) are excepted as on D01.
- Position: 26 of 33 layers pass; `402:5390`, `402:5403`, `402:5441` and
  `402:5443` fail.
  The shared navigation's items pass too: `rail · Inbox`,
  `rail · Workspaces` and `rail · Projects`.
- Rules: pass.

## Deviations

- **Text sizes (Message text).** Figma draws Erik's message in 13/19 and
  an agent's name in SemiBold 12 (D08 402:1066, 402:1072). The library's
  `Message` draws `body` (14/20) and `label` (14/500) and takes no text
  size, so both are about one size larger than Figma's (fidelity review
  D08 F2, F4).
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
- **Nav rail.** Figma's rail has no Artifacts or Toolkit item, so
  `rail · Artifacts` and `rail · Toolkit` have no layer, and
  `rail · More` sits 108 px lower (y +108). The design predates d-105,
  which adds the Toolkit (and Artifacts) item; the app draws the
  six-item navigation.
- **Figma layers.** Each sidebar block takes the frame's layer ids from the
  state's `data.layers` (D02b's node ids differ from D02's) and keeps D02's
  when a state sets none. This changes no pixel.

## Settings gear (d-119)

In the app, the rail has a Settings gear before More, which this frame
does not draw: Settings has no Figma page, and decision d-119 puts its
entry in the rail (`web/src/blocks/AppRail.tsx`). The Notifications
switch that d-118 put at the rail's end moved to the Settings page, so
the rail no longer draws it.
