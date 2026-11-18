# T07 deviations

What still differs from Figma T7 · New chat (D3's New chat form in a
dialog over bridge themes on the iPad mini, `tabletNewChat`), after the
last fidelity run (`pnpm fidelity workspaces T07`, 2026-11-18, library
1.0.0-beta.42), each with its reason. The library gaps are in
`web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is T2's
`PhoneChat` at the tablet's width (`device="tablet"`, with `tabletList`)
with D3's `NewChatDialog` (`Dialog size="lg"`, 540) open over it, with
T7's layers (`layers.newChatDialog`). The chat has no tab bar, so the
render has no Artifacts tab, and the dialog makes the chat under it
inert, so its composer's text is not counted: no exception is needed.

## Checks

- Text: pass. Every Figma string is in the render and visible; the
  render has no extra text.
- Position: fail, 5 of 25 layers pass: the header (`420:252`), the back
  button (`420:254`), the ⋯ (`420:265`), Erik's message (`420:281`) and
  the chat's composer (`420:298`). 20 fail:
  - `420:286` (Claude's reply with Copy): h +8.
  - `420:322` (the dialog): y +24, h -19.
  - `420:329` (Name field): y +24; `420:332` (its box): y +25.
  - `420:336` (Runs in field): y +24; `420:340`, `420:344` and
    `420:350` (Claude Code, Codex, shell): y +27.
  - `420:355` (Workspace field): y +24; `420:358` (its box): y +27.
  - `420:363` (Folders field): y +26; `420:367` (~/the-bridge): y +29,
    w -7; `420:371` (~/omni): x -9, y +29; `420:378` (Add folder):
    x -8.4, y +28.
  - `420:383` (Model field): y +27; `420:386` (its box): y +30.
  - `420:391` (First message field): y +29, h -20; `420:394` (its box):
    y +32, h -23.
  - `420:403` (Cancel): y +9; `420:405` (Start chat): y +8.
- Rules: pass.

## Deviations

- **The dialog sits 24 px lower and is 19 px shorter (Composer in a
  form), `420:322` y +24, h -19.** The first message box is `Composer`,
  which sizes its text area to one line (78 px against Figma's 101), so
  the dialog is 592 high against 611. `Dialog` centres in the app's
  screen, which starts under Figma's 29 px status bar (d-089, d-102);
  Figma centres the dialog over the whole frame, status bar included.
  The two together put the dialog 24 px lower. Every field moves down
  with it (`420:329`, `420:332`, `420:336`, `420:340`, `420:344`,
  `420:350`, `420:355`, `420:358`, `420:363`, `420:383`, `420:386`,
  `420:391`, y +24 to +30); inside the dialog each field is 0 to 6 px
  lower than Figma's, as on D03, because each label is 6 px over its
  control against Figma's 8 (Form field label) and the boxes are 36 px
  against Figma's 37 and 39 (Select field, Runs in choice).
- **The first message box is 23 px shorter (Composer in a form),
  `420:394` y +32, h -23, `420:391` y +29, h -20.** `Composer` draws one
  line of text; it also draws "/" (the skill button) and a send button,
  which Figma's box has not. Cancel and Start chat (`420:403` y +9,
  `420:405` y +8) sit under the shorter box, at the dialog's foot.
- **"random if blank" (Field hint).** Figma draws the hint inside the name
  field at its end; `TextField` has no slot there, so the hint is at the
  end of the label row, 20 px higher.
- **Folder chips (Folder chip), `420:367` w -7, `420:371` x -9,
  `420:378` x -8.4.** The paths are in `label` (Geist 14) against
  Figma's Geist Mono 13, the chips are 28 px against 30, and the × of
  ~/omni is part of the chip's button. ~/the-bridge's border is
  `border.selected` (`pressedBorder="selected"`), Figma's #5ee1ff at
  0.6; D03's chip now uses it too.
- **Runs in, Workspace and Model (Runs in choice, Select field, Selected
  toggle border).** The boxes are 36 px against Figma's 39 and 37, and
  the values are Medium 14 (`label`) against Regular 14. Claude Code's
  border is the pressed `border.active` (0.7) against Figma's opaque
  #5ee1ff.
- **Dialog padding.** The form is padded 20 (`Dialog`) against Figma's
  23, so the fields start 2 px further left and are 4 px wider (within
  the tolerance).
- **The chat's composer ends 1 px higher (Tablet safe area, closed by
  beta.42).** `AppShell size="tablet"` keeps 34 (`shell.safeAreaBottom`)
  under the detail with no tab bar, so the composer ends 34 over the
  screen's end, at y 1124, against Figma's 33 (y 1125 of 1158): y -4,
  h +3, within the tolerance.
- **Claude's reply is taller (Message text), `420:286` h +8.** `Message`
  draws the text in `body` (14/20) and the name in `label` against
  Figma's Geist 13 on a 19 px line and SemiBold 12, and Copy is 24 high
  against 22; the reply wraps at another word.
- **The ⋯ is lighter and the header is 2 px taller (Chat header, Chat
  header text).** As on T06: a thin 20 px `MoreIcon` against Figma's
  heavy 18 px icon, and the title in `subtitle` (17/24); within the
  tolerance.
- **The workspace.** Figma's T7 chooses the-bridge, as D3 does, so the
  state does too; the note says the workspace defaults to the current
  chat's (omni-brain). The chat actions' New chat opens the form with
  the current chat's workspace chosen.
- **The stars sit elsewhere (Backdrop stars).** `Backdrop size="tablet"`
  draws the library's fixed star field, not T7's own stars.
- **No status bar.** The app draws no status bar (d-089), so the
  side-by-side shows a blank band at the top.
- **Square screen corners (device chrome).** Figma draws the iPad's
  screen with rounded corners (the device frame); the app draws square
  corners, as it draws no device chrome (d-089, review T01 F3).
- **Cancel and Start chat are larger (Dialog footer buttons).** Figma
  draws Cancel's label in Geist Medium 12 (420:404, Figma read
  2026-11-18); `Button size="sm"` draws 13 px labels, and
  `textSize="xs"` would make both buttons 3 to 5 px narrower than
  Figma's and fail D03's position check, so the dialog keeps them
  (review T07 F1).
- **Stop in the chat's composer is larger (Composer text).** Figma's
  Stop label is 11 px; `Composer` draws it as `Button size="sm"` with
  `label` (14) (review T07 F2).
- **Thin icons (Icon stroke weight).** Figma draws the dialog's ×
  (420:326, 18 px), the back chevron, the model chips' chevrons and the
  composer's paperclips with a 2 px stroke at their own size, so they
  look heavy; the icon set draws a 2 px stroke in a 24 px box and takes
  no stroke weight, so at 12 to 20 px they look thinner and lighter
  (review T07 F3, T06 F2).
- **The model chip's chevron is grey (Model chip chevron).** Figma draws
  it in the text colour, as the chip's label; `ModelChip` draws its own
  chevron in a muted grey and takes no tone (review T06 F2).
- **Erik's message is larger (Message text).** Figma draws it in Geist
  13 on a 19 px line; `Message from="user"` draws `body` (14/20), so it
  is about 7% wider (review T06 F1).
- **Actions still to build.** Start chat, Add folder, the folder's ×
  and the attach button draw only, as on D03.
- **No exceptions.**
