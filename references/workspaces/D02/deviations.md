# D02 deviations

What still differs from Figma after the first build of Workspaces and side
chat (`pnpm fidelity workspaces`, 2026-11-17, against the library's
1.0.0-beta.18; measured on 1.0.0-beta.20), each with its reason. The library gaps are
in `web/src/pages/workspaces/LIBRARY_GAPS.md`.

## Checks

- Text: passes with the three entries in `exceptions.json` (Erik
  approved them on 2026-11-19).
  - `23%` (105:972, missing): the dragged row's meta is cut in the render
    (see `hiddenOverflow` below). The other percentages (`78%`, `42%`,
    `23%`, `18%`, `26%`) pass: `ContextMeter` draws each as one text node.
  - `Artifacts` and `Toolkit` (extra): the shared `AppRail` adds them before
    More (d-105), as on D01.
- Position: 25 of 33 layers pass; `105:960`, `105:874`, `105:889`,
  `105:933` and `105:935` fail. The drop hint (105:976) is not measured:
  `DragPreview` takes no `data-figma` (Drag preview).
  The shared navigation's items pass too: `rail · Inbox`,
  `rail · Workspaces` and `rail · Projects`.
- Rules: pass. The one `hiddenOverflow` finding, on the dragged row's
  meta line (105:960), is excepted in `exceptions.json` for the same
  reason as `23%`.

## Deviations

- **Text sizes (Message text).** Figma draws Erik's message in 13/19 and
  an agent's name in SemiBold 12 (D08 402:1066, 402:1072). The library's
  `Message` draws `body` (14/20) and `label` (14/500) and takes no text
  size, so both are about one size larger than Figma's (fidelity review
  D08 F2, F4).
- **Dragged chat (Drag preview).** `105:960` w -26.3, h -15.1: the chat
  is `DragPreview` (cyan border and shadow) around its row, not turned.
  Figma turns it about 3° and lets it pass the sidebar's right edge. The
  text check measures a turned row against its unturned clip box, and
  each run against the clip box of every DOM ancestor, so with `tilt` or
  past the sidebar's scrolling body it reports the row's text as cut,
  though nothing cuts it on screen. So the row is straight and ends at
  the rows' end (266 wide). Its meta is 132 px in 116, so "23%" is cut
  off (`hiddenOverflow`). It starts 50 in and 12 under the group header,
  Figma's place, in spacing tokens (40 and 10, 12; d-100).
- **Drop hint (Drag preview).** The hint is `DragPreview`'s pill: cyan
  text and border on the overlay fill, as Figma's, 4 under the chat at
  its left edge: 115, 409, 233 × 24 against Figma's 95, 413, 230 × 24.
- **Drop target (Sidebar group header).** The-bridge's header has the
  dashed cyan outline on the selected fill, drawn with `css()` around
  `GroupHeader`, which has no drop-target look.
- **Group header icons (Sidebar group header).** The ⋯, rename and close
  buttons are 24 px (`Button size="xs"`) with 12 px icons, against Figma's
  14 px icons with no button box; they sit 4 px into the header's padding
  so the header keeps Figma's height (30 against 28). They are text
  buttons with an `fg.muted` class, Figma's grey, where the text variant
  draws the accent.
- **Chat header (Chat header).** The header (105:785) is within the 4 px
  tolerance only because its gaps are cut to the 4 and 8 px tokens: the
  title is `subtitle` (24 px line, Figma 21) and the model chip is taller
  than Figma's 22. The chat actions button is 24 px high
  (`Button size="xs"`, Figma 30 × 22).
- **Main chat.** `105:874` h +8: the reply wraps in body text (14/20) and
  Copy is 24 px (Figma 22), as in D01. `105:889` y -7, h +7: the
  attachment chip, the 20 px text line and the 28 px buttons of `Composer`
  are taller than Figma's, as in D01. The transcript and composer are 24
  in from the sides (Figma 22: the nearest spacing token).
- **Attachment remove × (Composer attachment remove).** Figma's × on the
  attached file is bold; `Composer` draws its own thin `CloseIcon`, in the
  same `fg.muted`.
- **Sticky composer (d-107).** Only the transcript of the chat alone and
  of the side chat scrolls; the chat header, the side chat's title and
  each composer stay in view. The frame shows the top of the scroll, so
  this changes no pixel here.
- **Side chat.** `105:933` h +21 and `105:935` y +22, h +9: "Can Panda CSS switch
  themes while the app runs?" wraps to two lines in the render. `Message`
  pads the bubble 12, as Figma does, but the line is 1 px wider than the
  bubble's 321 px, so the answer starts 22 px lower. The panel is padded 16
  (Figma 17), and the bubble icon and "/btw" use `accent.discuss`.
- **Sidebar toggle.** The toggle (158:6) is a pressed `Button size="sm"`,
  28 px against Figma's 30; it sits after the title through the panel's
  `meta` slot. Figma draws its border #5ee1ff at about 0.6, an alpha no
  token has; it snaps to the nearest token, `border.selected` (0.5), in
  place of the pressed button's `border.active` (0.7). + is a `Button size="sm"` with a 16 px icon (Figma 36 × 28,
  14 px icon).
- **Skill-evals.** Figma draws skill-evals closed, so the state lists none
  of its chats; opening it shows no rows, though its count is 1.
- **Nav rail.** Figma's rail has no Artifacts or Toolkit item, so
  `rail · Artifacts` and `rail · Toolkit` have no layer, and
  `rail · More` sits 108 px lower (y +108). The design predates d-105,
  which adds the Toolkit (and Artifacts) item; the app draws the
  six-item navigation.
- **Scroll to the newest message (Erik's request, 2026-11-21).** Erik
  asked for "a button to scroll you all the way down to the bottom of the
  chat ... centered in the width and above the message box". Figma draws
  no such button. In a live chat, more than a screen above the end of the
  transcript, an icon-only library button with a down arrow floats 8 above
  the transcript's bottom, centred on its width, with a dot when new entries
  came in; a tap scrolls to the end and hides it (`blocks/NewestButton.tsx`,
  LIBRARY_GAPS.md: Scroll to newest). This frame's fixture chats are not
  live and sit at their own scroll, so its render does not change.
- **Live tool calls (review R32, a frame exception the app owns).** Erik
  wrote: "these tool messages aren't great like send message bash macro
  etc. how can we improve that". Figma draws a tool call as a tool line:
  a status dot and the tool's name and target in mono, `fg.muted`
  (105:873). A live call from a server with backend #371 keeps that line's
  mono, colour and 6 px gaps, but draws its kind's icon in the dot's place
  and state colour, a readable title in place of the raw name and its own
  one-line label in `fg.subtle` in place of the target; a run of two or
  more calls draws as one `ToolLine` with a summary of its kinds and
  counts, which a tap opens (`blocks/ToolRow.tsx`, `blocks/ToolGroup.tsx`;
  LIBRARY_GAPS.md: Tool row icon and label, Tool group row). Figma draws no
  icon, title, label or group. This frame's fixture calls have no kind, so
  they draw as before and its render does not change.

## Settings gear (d-119)

In the app, the rail has a Settings gear before More, which this frame
does not draw: Settings has no Figma page, and decision d-119 puts its
entry in the rail (`web/src/blocks/AppRail.tsx`). The Notifications
switch that d-118 put at the rail's end moved to the Settings page, so
the rail no longer draws it.

## Effort picker (W10)

Erik asked on 2026-11-21, through bridge-coord: "can't i switch models?
im pretty sure claude code lets you do this mid turn". The server sets a
live Claude chat's effort for its session only (backend #382, #384), so
the model chip (105:804, "Opus 5.5" with a chevron) of a live Claude chat
opens an effort menu: low, medium, high and xhigh, the current one
checked, with the effort after the model on the chip ("Opus 5.5 · high
effort", as D03 105:1418 writes it). Figma's chevron suggests a model
choice, and no frame draws the chip's menu. The model stays text, with no
model choice, until the server has a model route that restarts the chat
(W10 slice 2); a Codex chat's chip stays text (W8). A miss or the working
hint shows one line beside the chip, which Figma does not draw
(`blocks/EffortPicker.tsx`; LIBRARY_GAPS.md: Effort menu). It is a frame
exception that bridge-workbench owns. This frame's fixture chat is a
sample chat, so its chip and render do not change.

## Model picker (W10)

The server now restarts an idle live Claude chat with another model by
resume (backend #386, #390, #391: `POST /api/chats/:chat/model`, the
same session and chat ID), so the model chip (105:804) of a live Claude
chat opens one menu with the model families first (Fable, Opus, Sonnet,
Haiku, the list's family checked; no "Default") and then the effort
levels as "low effort" to "xhigh effort", the list's level described
"Current". The library's `ModelChip` passes one radio list with one
checked value and no section headings (LIBRARY_GAPS.md: Effort menu), so
both sections share that list and only the model has the check; bridge-
workbench's decision of 2026-11-21. A model pick asks on its own row under
the chip's row ("Restart the chat with Sonnet? It resumes the same
conversation." with Restart and Cancel, `blocks/ModelConfirm.tsx`); while
the restart runs the chip says "Restarting…". A restart that ended the
chat and started none opens a library dialog with `claude --resume
<session>` in a read-only field (`blocks/ModelRestartFailed.tsx`), as the
chat's header leaves with the chat. Figma draws none of these. It is a
frame exception that bridge-workbench owns. This frame's fixture chat is
a sample chat, so its chip and render do not change.
