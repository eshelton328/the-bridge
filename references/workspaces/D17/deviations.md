# D17 deviations

What still differs from Figma after the first build of the Subtask dialog
(`pnpm fidelity workspaces D17`, 2026-11-17, library 1.0.0-beta.20), each
with its reason. The library gaps are in
`web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is D2b's sidebar
layout without the side chat and the menu: bridge themes alone in the
middle, and the Subtask form (`SubtaskDialog`, `Dialog size="lg"`, 540)
open over it (`subtaskDialog`, `ui.chatDialog: 'subtask'`).

## Checks

- Text: pass. Every Figma string shows, the task's value "Draft layout
  notes for the three directions, one page each." included. `Artifacts`
  and `Toolkit` (rail, d-105) are excepted as on D01 to D16.
- Position: 19 of 29 layers pass; `417:982`, `417:995`, `417:1026`,
  `417:1087`, `417:1090`, `417:1095`, `417:1098`, `417:1114`, `417:1107`
  and `417:1109` fail. The sidebar, the chat header and the first
  message pass.
- Rules: pass.

## Deviations

- **Task box is shorter, and has a send button (Composer in a form).**
  `417:1098` y +13.5, h -23; `417:1095` y +10.5, h -20. The task is the
  library's `Composer`, which sizes its text area to one line (78 px in
  all against Figma's 101) and always draws its send button, so a cyan ↑
  shows at the box's end, beside where Figma has only the clip. No size
  token is near 101, as on D03.
- **Dialog is shorter and lower.** `417:1026` y +8.5, h -17: the box is
  23 px shorter at the task and 5 px taller at the note (below), so it is
  17 px shorter, and the dialog stays centred in the window, 8.5 px lower
  at its top. The model field (`417:1087` y +8.5) and its select box
  (`417:1090` y +11.5, 3 px more for the label row, below) move
  with it.
- **Note under the task (Message text).** `417:1114` y -9.5, h +5: the
  line "Gets this chat’s full context. Returns its result here." is
  `bodySm` (13/20) against Figma's 15 px text box; the library keeps line
  heights on the 4 px grid. It sits higher because the task box above is
  shorter.
- **Cancel and Start subtask sit higher.** `417:1107` y -4.5, `417:1109`
  y -5.5: the buttons follow the note at Figma's 16 px gap, so they move
  with the shorter dialog. Start subtask (`417:1109` x -4.3, w +6.3) is
  6 px wider: `Button textSize="smStrong"` sets the label wider than
  Figma's 77 px "Start subtask", and the button's padding is the
  library's `sm`.
- **Field labels (Form field label).** MODEL and WHAT SHOULD THE SUBTASK
  DO? are `eyebrow` spans 6 px above the control, against Figma's 8.
- **Model box (Select field).** The model is a secondary `Button size="lg"`
  (36 px) that opens a `RadioMenu`, against Figma's 37 px select box
  with the value in Regular 14; the library has no select field.
- **Main chat reply.** `417:982` h +7: the reply wraps in body text
  (14/20) and Copy is 24 px (Figma 22), as on D01, D02, D02b and D15
  (Message text).
- **Composer is lower.** `417:995` y +12, h +7: Figma's D17 puts the
  composer 35 px above the bottom, as D15 does, where D2b put it 16
  above; the shared `ChatPane` keeps D2b's place. Its height is
  `Composer`'s attachment chip, 20 px text line and 28 px buttons, 7 px
  taller than Figma's, as on D02b and D15.
- **Chat header and group headers (Chat header, Sidebar group header).**
  As on D02b: the ⋯ is a `Button size="xs"` (24 px) against 30 × 22, and
  the group header buttons are 24 px with 12 px icons.
- **Attachment remove × (Composer attachment remove).** Figma's × on
  theme-ideas.md is bold; `Composer` draws its own thin `CloseIcon`.
- **Rail.** The shared `AppRail` adds Artifacts and Toolkit before More
  (d-105), so More sits lower than Figma's.
