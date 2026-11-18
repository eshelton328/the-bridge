# D07 deviations

What still differs from Figma after the first build of one chat in the
workbench (`pnpm fidelity workspaces`, 2026-11-17, after the move to the
library's 1.0.0-beta.15; measured on 1.0.0-beta.18), each with its reason. The library gaps are in `web/src/pages/workspaces/LIBRARY_GAPS.md`.
The screen is D02b's sidebar with no menu open, beside the library's
`Workbench` in place of the chat alone (`ui.workbench`): the workspace tabs
with New chat, one pane (bridge themes, D01's chat with requirements.md
attached and "/" typed) and the status bar ("omni-brain · 1 pane"). The
sidebar has the toggle, so the tab bar has none.

## Checks

- Text: pass. The percentages (`78%`, `26%`, `42%`, `23%`, `18%`) pass
  without an exception:
  `ContextMeter` draws each as one text node. `Artifacts` and `Toolkit`
  (rail, d-105) are excepted as on D01 to D06.
- Position: 15 of 20 layers pass; `402:471`, `402:485`, `402:510`,
  `402:515` and `402:528` fail.
- Rules: pass.

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
- **Tab bar (Workbench tab bar).** `402:471` x +34.7: the bar is 52 px
  (`Workbench size="compact"`, as on D01 and D05), but the four tabs are
  35 px wider than Figma's together, so New chat, a 28 px
  `Button size="sm"`, sits 35 px further right.
- **Pane (Workbench tab bar).** `402:485` y -10, h +8: Figma pads the one
  pane 10 above, and `compact` starts the panes right under the bar, as
  D01's four panes are. `size="md"` pads 10 but draws a taller bar, which
  put the pane 6 px lower and the transcript 10 px lower; the build keeps
  one bar size for every Workbench state.
- **Transcript.** `402:510` y -6.5 and `402:515` y -5.5, h +7: the entries
  move up with the pane. The reply wraps in body text (14/20), and Copy
  is 24 px (Figma 22).
- **Composer.** `402:528` y -8.5, h +7: the attachment chip, the 20 px
  text line and the 28 px buttons of `Composer` are taller than Figma's,
  as on D01 and D02b. Figma draws the composer focused with a caret after
  "/"; the story does not focus it. The composer keeps the layout the
  earlier frames use (d-107).
- **Attachment remove × (Composer attachment remove).** Figma's × on the
  attached file is bold; `Composer` draws its own thin `CloseIcon`, in the
  same `fg.muted`.
- **Group header icons (Sidebar group header).** The ⋯, rename and close
  buttons are 24 px (`Button size="xs"`) with 12 px icons, against Figma's
  14 px icons with no button box, as on D02b. They are drawn in `fg.muted`,
  Figma's grey.
- **Rail.** The shared `AppRail` adds Artifacts and Toolkit before More
  (d-105), so More sits lower than Figma's.

No value in this build needed a d-100 pick: the new parts reuse the
blocks and tokens of D01 and D02b.
