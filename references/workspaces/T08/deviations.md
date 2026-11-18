# T08 deviations

What still differs from Figma T8 · Fork a chat (D15's Fork form in a
dialog over bridge themes on the iPad mini, `tabletFork`), after the last
fidelity run (`pnpm fidelity workspaces`, 2026-11-18, library
1.0.0-beta.39), each with its reason. The library gaps are in
`web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is T2's
`PhoneChat` at the tablet's width (`device="tablet"`, with `tabletList`)
with D15's `ForkDialog` (`Dialog size="lg"`, 540) open over it in place
of M18's sheet, with T8's layers (`layers.forkDialog`). The chat has no
tab bar, so the render has no Artifacts tab, and the dialog makes the
chat under it inert: no exception is needed.

## Checks

- Text: pass. Every Figma string is in the render and visible, the name
  field's value `bridge themes · fork` included; the render has no extra
  text.
- Position: fail, 4 of 14 layers pass: the header (`420:474`), the back
  button (`420:476`), the ⋯ (`420:487`) and Erik's message (`420:503`).
  10 fail:
  - `420:508` (Claude's reply with Copy): h +8.
  - `420:520` (the chat's composer): y +30.
  - `420:544` (the dialog): y +14.
  - `420:551` (Name field): y +14.
  - `420:558` (Start from field): y +14.
  - `420:562` (Whole chat) and `420:566` (Up to a message…): y +17.
  - `420:632` (the note): y +14, h +5.
  - `420:625` (Cancel): y +19; `420:627` (Fork): y +18.
- Rules: pass.

## Deviations

- **The dialog sits 14 px lower (status bar), `420:544` y +14.** The
  dialog is 298 high against Figma's 297. `Dialog` centres in the app's
  screen, which starts under Figma's 29 px status bar (d-089, d-102);
  Figma centres the dialog over the whole frame, status bar included, so
  the render's dialog is half the bar's height lower, as on T07. Every
  part of the form moves down with it: the Name field (`420:551`) and
  the Start from field (`420:558`) y +14, the note (`420:632`) y +14.
- **The choices sit 3 px lower and are 3 px shorter (Form field label,
  Runs in choice), `420:562` and `420:566` y +17.** START FROM is an
  `eyebrow` span 6 px above the choices against Figma's 8, and the
  choices are `Button size="lg"` (36 px) against Figma's 39, with the
  label in Medium 14 (`label`) against Regular 14, as on D15.
- **The note is 5 px taller (Message text), `420:632` h +5.** The line
  "The fork copies the messages and the context. The original keeps
  running." is `bodySm` (13/20); Figma's text box is 15 high, and the
  library keeps line heights on the 4 px grid (d-072).
- **Cancel and Fork sit lower, `420:625` y +19, `420:627` y +18.** They
  follow the note, which is 5 px taller, at Figma's 16 px gap, in the
  dialog that sits 14 px lower.
- **"you can rename it later" sits over the field (Field hint).** Figma
  draws the hint inside the name field at its end; `TextField` has no
  slot there, so the hint is at the end of the NAME label row, about
  20 px higher, as on D15.
- **The chat's composer sits at the screen's end (Tablet safe area),
  `420:520` y +30.** Figma ends T8's composer 33 over the screen's end
  (y 1125 of 1158). `AppShell size="tablet"` keeps no safe area under
  the detail when there is no tab bar, so the composer ends at the
  screen's end, as on T02b, T06 and T07. Library beta.42 adds the tablet
  safe area.
- **Claude's reply is taller (Message text), `420:508` h +8.** `Message`
  draws the text in `body` (14/20) and the name in `label` against
  Figma's Geist 13 on a 19 px line and SemiBold 12, and Copy is 24 high
  against 22; the reply wraps at another word.
- **Erik's message and the composer's text are larger (Message text,
  Composer text).** Figma draws Erik's message in Geist 13 on a 19 px
  line and Stop's label at 11 px; `Message from="user"` draws `body`
  (14/20) and `Composer` draws Stop as `Button size="sm"` with `label`
  (14).
- **The ⋯ is lighter and the header is 2 px taller (Chat header, Chat
  header text).** As on T06 and T07: a thin 20 px `MoreIcon` against
  Figma's heavy 18 px icon, and the title in `subtitle` (17/24); within
  the tolerance.
- **Thin icons (Icon stroke weight).** Figma draws the dialog's ×, the
  back chevron, the model chips' chevrons and the composer's paperclip
  with a 2 px stroke at their own size, so they look heavy; the icon set
  draws a 2 px stroke in a 24 px box, so at 12 to 20 px they look
  thinner and lighter.
- **The model chip's chevron is grey (Model chip chevron).** Figma draws
  it in the text colour, as the chip's label; `ModelChip` draws its own
  chevron in a muted grey and takes no tone.
- **Dialog padding.** The form is padded 20 (`Dialog`) against Figma's
  23, so the fields start 2 px further left and are 4 px wider (within
  the tolerance).
- **Focus.** Figma draws no focus ring. The dialog box itself takes the
  focus when it opens (`initialFocus`), as on D15.
- **The stars sit elsewhere (Backdrop stars).** `Backdrop size="tablet"`
  draws the library's fixed star field, not T8's own stars.
- **No status bar.** The app draws no status bar (d-089), so the
  side-by-side shows a blank band at the top.
- **Square screen corners (device chrome).** Figma draws the iPad's
  screen with rounded corners (the device frame); the app draws square
  corners, as it draws no device chrome (d-089, review T01 F3).
- **Actions still to build.** As on D15, Fork starts nothing, and Up to
  a message… is chosen but does not yet ask for the message.
- **No exceptions.**
