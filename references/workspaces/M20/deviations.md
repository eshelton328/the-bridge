# M20 deviations

What still differs from Figma M20 · Start a subtask (the Subtask sheet over
bridge themes on the phone, `phoneSubtask`), after the last fidelity run
(`pnpm fidelity workspaces M20`, 2026-11-18, library 1.0.0-beta.36), each
with its reason. The library gaps are in
`web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is M18's
`PhoneChat` with the message box empty and out of focus, under the Subtask
sheet (`PhoneSubtask`: `BottomSheet` with `title` and `closeButton`, D17's
fields in `SubtaskFields` and a primary Start subtask), open while
`ui.chatDialog` is `subtask`. The chat actions' Subtask opens it and ×
closes it (`WorkspacesPhoneSubtask.test.tsx`).

## Checks

- Text: pass. Every Figma string shows, the task's value
  `Draft layout notes for the three directions.` included; no extra text.
- Position: fail, 6 of 12 layers pass: the header (`422:444`), the back
  button (`422:446`), the ⋯ (`422:457`), Erik's message (`422:473`),
  Start subtask (`422:599`) and the note (`422:608`). Six fail:
  - `422:478` (Claude's reply): h +9, as in M17 and M18.
  - `422:491` (the composer): y -12, h +7, as in M18.
  - `422:581` (the model field): y +21.
  - `422:584` (the model box): y +24.
  - `422:589` (the task field): y +23, h -20.
  - `422:592` (the task box): y +26, h -23.
- Rules: pass.

Render minus Figma, in px. All three checks render the page 38 px
shorter, below Figma's status bar (d-102), and the position check adds
38 to each render y (d-101).

## Deviations

- **The task box is 23 px shorter and has a send button, so the sheet
  starts about 24 px lower (Composer in a form), `422:592` y +26, h -23;
  `422:589` y +23, h -20; `422:581` y +21; `422:584` y +24.** Figma's
  task is a 101 px box with the text at the top, the clip button at the
  bottom and no send button. The task is the library's `Composer`, as in
  D17: it sizes its text area to one line (78 px in all) and always draws
  its cyan ↑ send button at the box's end, and has no prop to drop it.
  The ↑ is a known extra element: the task box in a form must not draw a
  send arrow, as Start subtask is the action (review decision), and the
  gap row asks the library for that prop. The sheet grows upward from
  the bottom of the screen, so the 23 px it loses, and the note's 1 px,
  move the title, the model and the task's label down by about 24 px.
- **The note is Geist, not Inter, and a little darker (Phone fork
  sheet).** Figma draws "Gets this chat’s full context. Returns its
  result here." (422:608) in Inter Regular 12 in #99a6bf on a 15 px line;
  the note is `small` (Geist Regular 12/16) in `fg.muted` (#8a97b8), as
  the library has neither Inter nor that grey. The box is 16 high against
  15, within the tolerance.
- **The sheet has a grabber and a smaller title (Phone fork sheet).**
  Figma's sheet has no grabber, and its title "Start a subtask" is
  SemiBold 20 with an 18 px ×. `BottomSheet` always draws the grabber,
  draws its `md` title in `subtitle` (17/24) and its close button as a
  28 px button with a 16 px ×, and takes no title size.
- **Start subtask is 36 px high with a 16 px arrow (Phone fork sheet).**
  Its label is Figma's Geist Medium 12 (422:607, `textSize="xs"`).
  Figma's button (422:599) is 356 × 40 with a 14 px up arrow (422:604);
  no button is 40 high, and `lg` (36) is used, as M18's Fork, and the
  icon set has no 14 px size.
- **The model box (Select field).** The box is a secondary `Button
  size="lg"`, 36 high against Figma's 37, with a 16 px chevron against
  14, and its value in Medium 14 against Regular 14.
- **Field labels (Form field label).** MODEL and WHAT SHOULD THE SUBTASK
  DO? are `eyebrow` spans 16 px high, 6 px above the control, against
  Figma's 13 px labels, so each field is 2 px taller, as in D17.
- **Task text and clip (Composer text).** The task is `Composer`'s `body`
  (14) against Figma's Regular 13 (422:593), and the clip in the attach
  square is the set's thin 16 px `ClipIcon` against Figma's 14 px.
- **Claude's reply is 9 px taller, Erik's message and the name wider
  (Message text), `422:478` h +9.** As in M17: `Message` draws the reply
  and Erik's message in `body` (14/20) and the name in `label` (14/500);
  Figma draws both texts in Geist Regular 13 on a 19 px line and the name
  (422:482) in SemiBold 12. Erik's first line (422:474) is about 7% wider
  (324 against 301 px), and "Claude" is 46 wide against 41. Copy is about 67 × 24 against Figma's 63 × 22.
- **The composer is 7 px taller and starts 12 px higher (Composer text,
  Phone safe area), `422:491` y -12, h +7.** As in M18: `Composer` draws
  its text in `body` and Stop as `Button size="sm"`, so the box is 112
  high against 105, and `AppShell` keeps a 34 px safe area under it.
- **The header is 4 px taller, the back chevron thinner and the ⋯ lighter
  (Chat header, Chat header text).** As in M17: the title is `subtitle`
  (17/24) against SemiBold 16 at 21, the model chip 26 high against 22,
  and the ⋯ a 20 px `MoreIcon`. The back chevron (422:446) is a 2 px
  stroke at 20 px in Figma; `ChevronLeftIcon` draws the same path in a 24
  px box with stroke 2 and takes no stroke prop, so at 20 px its stroke is
  about 1.7 px.
- **The attachment chip is 26 high with thin icons (Composer attachment
  remove).** As in M17.
- **The stars sit elsewhere (Backdrop stars).** `Backdrop size="phone"`
  draws the Inbox phone frame's stars at fixed places, not M20's.
- **Status bar and home indicator.** Figma draws a 38 px status bar
  (9:41), the home indicator and the frame's rounded corners; the app
  draws none (d-089), so the side-by-side shows a blank band at the top.
- **Actions still to build.** Start subtask draws only: it starts no
  subtask and leaves the sheet open, and the model box opens its list but
  the pick is not kept. The task's attach and send, the chat's attach,
  Stop, Send, the model chip and Copy draw only, as in M17.
- **No exceptions.**
