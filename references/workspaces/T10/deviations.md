# T10 deviations

What still differs from Figma T10 · Start a subtask (D17's Subtask form
in a dialog over bridge themes on the iPad mini, `tabletSubtask`), after
the last fidelity run (`pnpm fidelity workspaces`, 2026-11-18, library
1.0.0-beta.42), each with its reason. The library gaps are in
`web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is T2's
`PhoneChat` at the tablet's width (`device="tablet"`, with `tabletList`)
with D17's `SubtaskDialog` (`Dialog size="lg"`, 540) open over it in
place of M20's sheet, with T10's layers (`layers.subtaskDialog`). The
chat has no tab bar, so the render has no Artifacts tab, and the dialog
makes the chat under it inert: no exception is needed.

## Checks

- Text: pass. Every Figma string is in the render and visible; the
  render has no extra text.
- Position: fail, 5 of 14 layers pass: the header (`420:837`), the back
  button (`420:839`), the ⋯ (`420:850`), Erik's message (`420:866`) and
  the chat's composer (`420:883`). 9 fail:
  - `420:871` (Claude's reply with Copy): h +8.
  - `420:907` (the dialog): y +23, h -17.
  - `420:968` (Model field): y +23.
  - `420:971` (the model's box): y +26.
  - `420:976` (the task field): y +25, h -20.
  - `420:979` (the task's box): y +28, h -23.
  - `420:995` (the note): y +5, h +5.
  - `420:988` (Cancel): y +10.
  - `420:990` (Start subtask): x -4.3, y +9, w +6.3.
- Rules: pass.

## Deviations

- **The task box is 23 px shorter and draws a cyan send arrow (Composer
  in a form), `420:979` h -23, `420:976` h -20.** Figma's task box is a
  101 px box with the clip button and no send button. `Composer` sizes
  its text area to one line (78 px in all) and always draws the send
  button, so a cyan ↑ shows at the box's end, as on D17. The library
  value to add is a `Composer` prop that drops the send button
  (`send={false}`); beta.42 does not have it.
- **The dialog is 17 px shorter and sits 23 px lower, `420:907` y +23,
  h -17.** The dialog is shorter by the task box (above). `Dialog`
  centres in the app's screen, which starts under Figma's 29 px status
  bar (d-089, d-102), and Figma centres the dialog over the whole frame,
  so the render's dialog is half the bar's height (14.5) lower, plus
  half of the 17 px it is shorter (8.5), as on T07 and T08. The fields
  move down with it: the Model field (`420:968`) y +23 and its box
  (`420:971`) y +26, the task field (`420:976`) y +25 and its box
  (`420:979`) y +28; the labels are an `eyebrow` span 6 px above the
  control against Figma's 8 (Form field label), and the model's box is
  36 high against 37 (Select field).
- **The note sits 5 px lower and is 5 px taller (Message text),
  `420:995` y +5, h +5.** The line "Gets this chat’s full context.
  Returns its result here." is `bodySm` (13/20); Figma's text box is 15
  high, and the library keeps line heights on the 4 px grid (d-072). It
  follows the shorter task box in the lower dialog.
- **Cancel and Start subtask sit lower, and Start subtask is wider
  (Dialog footer buttons), `420:988` y +10, `420:990` x -4.3, y +9,
  w +6.3.** They follow the taller note at Figma's 16 px gap. Cancel is
  28 high against Figma's 30, and `Button size="sm" textSize="smStrong"`
  draws Start subtask's label in SemiBold 13, as T07's footer draws
  Start chat, so it is 6 px wider and starts 4 px further left, as on
  D17.
- **The chat's composer ends 1 px higher (Tablet safe area, closed by
  beta.42).** `AppShell size="tablet"` keeps 34 (`shell.safeAreaBottom`)
  under the detail with no tab bar, so the composer ends 34 over the
  screen's end, at y 1124, against Figma's 33 (y 1125 of 1158): y -4,
  h +3, within the tolerance, as on T07.
- **Claude's reply is taller (Message text), `420:871` h +8.** `Message`
  draws the text in `body` (14/20) and the name in `label` against
  Figma's Geist 13 on a 19 px line and SemiBold 12, and Copy is 24 high
  against 22; the reply wraps at another word.
- **Erik's message is larger (Message text).** Figma draws Erik's
  message in Geist 13 on a 19 px line; `Message from="user"` draws `body`
  (14/20). Stop's label is 12 px against Figma's 11, the 4 px grid's size
  (`stopTextSize`, library beta.80, d-100).
- **The ⋯ is lighter and the header is 2 px taller (Chat header, Chat
  header text).** As on T08: a thin 20 px `MoreIcon` against Figma's
  heavy 18 px icon, and the title in `subtitle` (17/24); within the
  tolerance.
- **Thin icons (Icon stroke weight).** Figma draws the dialog's ×, the
  back chevron, the model chevrons and the paperclips with a 2 px stroke
  at their own size, so they look heavy; the icon set draws a 2 px
  stroke in a 24 px box, so at 12 to 20 px they look thinner and
  lighter.
- **The model chip's chevron is grey (Model chip chevron).** Figma draws
  it in the text colour, as the chip's label; `ModelChip` draws its own
  chevron in a muted grey and takes no tone.
- **Dialog padding.** The form is padded 20 (`Dialog`) against Figma's
  23, so the fields start 2 px further left and are 4 px wider (within
  the tolerance).
- **The stars sit elsewhere (Backdrop stars).** `Backdrop size="tablet"`
  draws the library's fixed star field, not T10's own stars.
- **No status bar.** The app draws no status bar (d-089), so the
  side-by-side shows a blank band at the top.
- **Square screen corners (device chrome).** Figma draws the iPad's
  screen with rounded corners (the device frame); the app draws square
  corners, as it draws no device chrome (d-089, review T01 F3).
- **Actions still to build.** As on D17, Start subtask starts nothing.
- **The task text is brighter (Composer in a form).** Figma draws the
  typed task (420:980) in `fg.muted` (#8a97b8), as the typed values of the
  other forms' fields; `Composer` draws its value in `fg.default` and
  takes no tone, so it reads near-white (review T10 F2). The state keeps the task a
  typed value, as D17 and M20 do.
- **The chat's composer shows no outline under the dialog (Composer
  under a dialog).** Figma draws it with the cyan focus border (420:883:
  #5ee1ff at 0.6), which reads teal-grey under the scrim (#070b14 at
  0.65, the same as `overlay.scrim`). The focus is in the dialog, so
  `Composer` draws its resting `border.default` (#24314f), which the
  scrim makes near-invisible; it takes no prop for the focus border
  without the focus (review T10 F1).
- **No exceptions.**
