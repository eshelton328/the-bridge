# M05 deviations

What still differs from Figma M5 · Side chat (D2's side chat with M5's
note, in a sheet over bridge themes on the phone, `phoneSideChat`), after
the last fidelity run (`pnpm fidelity workspaces M05`, 2026-11-18, library
1.0.0-beta.30), each with its reason. The library gaps are in
`web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is M3's
`PhoneChat` with `ui.sideChatOpen` set: `PhoneSideChat` (`BottomSheet
size="sm"` with no title row) holds `SideChatPanel placement="sheet"`, and
the focus is in its message box.

## Checks

- Text: pass. Every Figma string shows, both Copy buttons included.
  `exceptions.json` lists the main composer's placeholder ("Message, or /
  for a skill") and "Stop": the main composer stays at the bottom of the
  chat (d-107) and the sheet covers it whole, but the text check counts a
  covered run as extra text. Figma leaves the main composer out under its
  sheet.
- Position: fail, 4 of 10 layers pass: the header (`105:3059`), the back
  button (`105:3061`), the ⋯ (`105:3072`) and Erik's message
  (`105:3088`). Six fail:
  - `105:3093` (Claude's reply in the main chat): h +9.
  - `105:3109` (the side chat's title row): y +221.
  - `105:3120` (the note): y +223.
  - `105:3121` (Erik's side question): y +221.
  - `105:3123` (Claude's side answer): y +222, h +28.
  - `105:3136` (the side composer): y -17.
- Rules: pass.

## Deviations

- **The sheet is shorter and starts much lower (Phone side chat sheet),
  `105:3109` y +221, `105:3120` y +223, `105:3121` y +221, `105:3123`
  y +222.** Figma's sheet is 620 high from y 224 to the screen's end, with
  an empty space between the answer and the composer. `BottomSheet` is as
  high as its content and no size token gives 620, so the sheet starts at
  about y 462: the title row, the note and the transcript sit about 221 px
  lower, with no empty space above the composer. Library beta.30's
  `ScrollFrame` footer (#134) no longer pads 4 above the side composer,
  so the sheet is 4 px shorter than with beta.28 and starts 4 px lower. So Claude's reply and
  Copy in the main chat show above the sheet, under the scrim, where
  Figma's sheet covers them.
- **The side composer sits 17 px higher (Phone side chat sheet),
  `105:3136` y -17.** Figma ends the composer 21 over the screen's end;
  `BottomSheet` keeps the 34 px safe area (`shell.safeAreaBottom`) under
  its content.
- **The side answer is 28 px taller and wraps to three lines (Message
  text), `105:3123` h +28.** `Message` draws the answer in `body` (14/20)
  against Figma's Geist 13 on a 19 px line, so "ahead of time" and "the
  token variables" move to new lines.
- **Claude's reply in the main chat is 9 px taller (Message text),
  `105:3093` h +9.** As in M03 and M04.
- **The bubble and × are 20 px (Phone side chat sheet).** Figma draws them
  at 18; the icon set has no 18 px size. The title row is 24 high against
  Figma's 22, as the × sits in a 24 px button.
- **The ⋯ is lighter (Chat header).** As in M03 and M04, a 20 px thin
  `MoreIcon` against Figma's heavy 18 px icon, under the scrim.
- **The stars sit elsewhere (Backdrop stars).** Figma draws the frame's
  own 22 stars behind the screen (105:3035 to 105:3056); `Backdrop
  size="phone"` draws the Inbox phone frame's 22 stars (346:8982) at
  fixed places and takes no positions, so the render's dots have Figma's
  count and tone but sit in other places. The chat's body has no fill in
  Figma (105:3087), so its stars show under the scrim too, as the
  render's do; few of Figma's fall above the sheet, which starts at y
  224.
- **No home indicator.** The app draws no status bar or home indicator
  (d-089), so the side-by-side shows a blank band at the top.
- **What the side chat does not do yet.** The composer does not send; ×,
  the scrim and Escape close the sheet, and Side chat in the chat actions
  sheet opens it again.
