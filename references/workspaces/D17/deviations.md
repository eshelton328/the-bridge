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
- Position: 22 of 35 layers pass; `417:982`, `417:995`, `417:1026`,
  `417:1087`, `417:1090`, `417:1095`, `417:1098`, `417:1114`, `417:1107`
  and `417:1109` fail. The sidebar, the chat header and the first
  message pass.
  The shared navigation's items pass too: `rail · Inbox`,
  `rail · Workspaces` and `rail · Projects`.
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
- **Main pane text is a little larger (Chat header text, Composer text,
  Message text).** The chat title is `subtitle` (SemiBold 17) against
  Figma's SemiBold 16 (D19 417:1669), the composer's placeholder `body`
  (14) against Regular 13 (D19 417:1719), and Erik's message `body` (14/20)
  against `bodySm` (13/20), so each runs about 7 to 8% wider than
  Figma's. No text style is SemiBold 16, and `Composer` and `Message`
  take no text size. The workspace line and "context" under the title
  are `monoSm` and `smallXs`, as Figma's (D19 417:1670, 417:1689).
- **Task text and clip (Composer text, Composer in a form).** The task is
  `Composer`'s `body` (14) against Figma's Regular 13 (417:1099). The clip
  sits in the 28 px square Figma draws (417:1101), but it is the set's
  16 px `ClipIcon` with a thin stroke, where Figma's (417:1102) is 14 px
  with a 2 px stroke, so the square reads emptier. `TextArea` would drop
  the send button but draws `surface.inset` with no room for the clip in
  its box, so the form keeps `Composer`.
- **Nav rail.** Figma's rail has no Artifacts or Toolkit item, so
  `rail · Artifacts` and `rail · Toolkit` have no layer, and
  `rail · More` sits 108 px lower (y +108). The design predates d-105,
  which adds the Toolkit (and Artifacts) item; the app draws the
  six-item navigation.
- **The task text is brighter (Composer in a form).** On T10, D17's form
  over the tablet chat, Figma draws the typed task (420:980) in
  `fg.muted` (#8a97b8), as the typed values of the other forms' fields;
  D17's own text node (417:1099) was not read. `Composer` draws its value
  in `fg.default` and takes no tone, so it reads near-white, as on T10.
  The state keeps the task a typed value, as T10 and M20 do.

## Settings gear (d-119)

In the app, the rail has a Settings gear before More, which this frame
does not draw: Settings has no Figma page, and decision d-119 puts its
entry in the rail (`web/src/blocks/AppRail.tsx`). The Notifications
switch that d-118 put at the rail's end moved to the Settings page, so
the rail no longer draws it.
