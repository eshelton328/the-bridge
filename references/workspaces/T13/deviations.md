# T13 deviations

What still differs from Figma T13 · Moved (the chat moved to the-bridge
on the iPad mini, `tabletMovedChat`), after the last fidelity run
(`pnpm fidelity workspaces T13`, 2026-11-18, library 1.0.0-beta.39),
each with its reason. The library gaps are in
`web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is T6's
`PhoneChat` at the tablet's width (`device="tablet"`, with `tabletList`):
`ChatHead size="full"` over `ChatPane size="tablet"`, still Working, with
the header naming the-bridge. D20's `ChatToast` ("Moved bridge themes to
the-bridge" and Undo) sits in `ChatPane`'s `above` slot over the
composer, as in M22, while `ui.toastOpen`; Undo closes it. The composer
is empty, with the focus and Stop, as in T11. Back returns to the list,
where bridge themes and theme tokens head the-bridge, as in D20. The chat
has no tab bar, so the render has no Artifacts tab, and no exception is
needed.

## Checks

- Text: pass. Every Figma string is in the render and visible, the
  toast's text and Undo included; the render has no extra text.
- Position: fail, 4 of 7 layers pass: the header (`420:1422`), the back
  button (`420:1424`), the ⋯ (`420:1435`) and Erik's message
  (`420:1451`). Three fail:
  - `420:1456` (Claude's reply with Copy): h +8.
  - `toast` (the toast, 420:1491): x +24.2, y +40, w -48.4 (h -2).
  - `420:1468` (the composer): y +30.
- Rules: pass.

Render minus Figma, in px. All three checks render the page 29 px
shorter, below Figma's status bar (d-102), and the position check adds
29 to each render y (d-101).

## Deviations

- **The composer sits at the screen's end (Tablet safe area),
  `420:1468` y +30.** Figma ends T13's composer 33 over the screen's end
  (y 1125 of 1158). `AppShell size="tablet"` keeps no safe area under
  the detail when there is no tab bar, so the composer ends at the
  screen's end, as on T02b, T06 and T08 to T12. It is measured again
  after the rebase on library beta.42.
- **The toast is narrower, its text smaller and it sits lower (Toast
  size, Tablet safe area), `toast` x +24.2, y +40, w -48.4.** Figma's
  toast (420:1491) is 306 × 40, its message and Undo in 14 px text, 17 px
  in from each side and 16 px between them. The library's `Toast` has one
  size: 12 px text, 12 px sides and an 8 px gap, so it is about 258 × 38,
  as on D20. It is centred over the composer, as in Figma. It is 40 px
  lower: 30 px because the composer is 30 px lower (above), and 8 px
  because `ChatPane`'s `above` slot keeps 12 px between the toast and the
  composer, where Figma keeps 20 here (D20's and M22's toasts share the
  slot, and M22 keeps Figma's 12 there).
- **Claude's reply is taller (Message text), `420:1456` h +8.**
  `Message` draws the text in `body` (14/20) and the name in `label`
  against Figma's Geist 13 on a 19 px line and SemiBold 12, and Copy is
  24 high against 22; the reply wraps at another word ("long" moves to
  the second line).
- **The composer is 3 px taller and Stop is larger (Composer text).**
  `Composer` draws the placeholder in `body` and Stop as
  `Button size="sm"`, so Stop is wider and its label larger than
  Figma's 61 px Stop with an 11 px label; the height is within the
  tolerance.
- **No caret.** The message box has the focus (its border is cyan), but
  the screenshots hide the caret; Figma draws none here either.
- **The ⋯ is lighter and the header is 2 px taller (Chat header, Chat
  header text).** As on T06: a thin 20 px `MoreIcon` against Figma's
  heavy 18 px icon, and the title in `subtitle` (17/24); within the
  tolerance.
- **The transcript sits 24 in from the sides, Figma's 22,** on the 4 px
  grid; within the tolerance.
- **The stars sit elsewhere (Backdrop stars).** `Backdrop size="tablet"`
  draws the library's fixed star field, not T13's own stars.
- **No status bar.** The app draws no status bar (d-089), so the
  side-by-side shows a blank band at the top.
- **Square screen corners (device chrome).** Figma draws the iPad's
  screen with rounded corners; the app draws no device chrome (d-089).
- **Thin icons (Icon stroke weight).** Figma draws the back chevron, the
  model chips' chevrons, the composer's paperclip and the stop mark with
  a 2 px stroke at their own size; the icon set draws a 2 px stroke in a
  24 px box, so at 12 to 20 px they look thinner and lighter.
- **The model chip's chevron is grey (Model chip chevron).** Figma draws
  it in the text colour; `ModelChip` draws its own chevron in a muted
  grey and takes no tone.
- **Erik's message is larger (Message text).** Figma draws it in Geist
  13 on a 19 px line; `Message from="user"` draws `body` (14/20).
- **Actions still to build.** Attach, Stop and Send draw only, as in
  T11; Undo closes the toast without moving the chat back, and the toast
  does not close by itself after a few seconds, as in M22.
- **No exceptions.**
