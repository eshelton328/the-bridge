# T06 deviations

What still differs from Figma T6 · One chat at a time (bridge themes full
screen on the iPad mini, `tabletOneChat`), after the last fidelity run
(`pnpm fidelity workspaces T06`, 2026-11-18, library 1.0.0-beta.39),
each with its reason. The library gaps are in
`web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is T2's
`PhoneChat` at the tablet's width (`device="tablet"`, with `tabletList`):
`ChatHead size="full"` over `ChatPane size="tablet"`, with "/" typed
after requirements.md was attached and the focus in the message box with
the skills closed (`ui.messageFocus`, as in M17); Stop shows while the
chat works. The tablet has no split panes and no drop targets, so the
chat alone fills the screen. The chat has no tab bar, so the render has
no Artifacts tab, and no exception is needed.

## Checks

- Text: pass. Every Figma string is in the render and visible; the
  render has no extra text.
- Position: fail, 4 of 6 layers pass: the header (`402:10404`), the
  back button (`402:10406`), the ⋯ (`402:10417`) and Erik’s message
  (`402:10433`). Two fail:
  - `402:10438` (Claude's reply with Copy): h +8.
  - `402:15201` (the composer): y +9, h +7.
- Rules: pass.

## Deviations

- **The composer sits at the screen's end (Tablet safe area),
  `402:15201` y +9.** Figma ends T6's composer 16 over the screen's end
  (y 1142 of 1158). `AppShell size="tablet"` keeps no safe area under
  the detail when there is no tab bar, so the composer ends at the
  screen's end, as on T02b and T04.
- **The composer is 7 px taller (Composer text, Composer attachment
  remove), `402:15201` h +7.** `Composer` draws its text in `body` and
  Stop as `Button size="sm"`, so Stop is wider than Figma's 61; the
  attachment chip is 26 high against Figma's 22, with a thin paperclip
  and × against Figma's heavy ones.
- **Claude's reply is taller (Message text), `402:10438` h +8.**
  `Message` draws the text in `body` (14/20) and the name in `label`
  against Figma's Geist 13 on a 19 px line and SemiBold 12, and Copy is
  24 high against 22; the reply wraps at another word ("long" moves to
  the second line).
- **No caret.** Figma draws the caret after "/" (402:15211). The message
  box has the focus (its border is cyan), but the screenshots hide the
  caret.
- **The ⋯ is lighter and the header is 2 px taller (Chat header, Chat
  header text).** As on T02b: a thin 20 px `MoreIcon` against Figma's
  heavy 18 px icon, and the title in `subtitle` (17/24); within the
  tolerance.
- **The transcript sits 24 in from the sides, Figma's 22,** on the 4 px
  grid; within the tolerance.
- **The stars sit elsewhere (Backdrop stars).** `Backdrop size="tablet"`
  draws the library's fixed star field, not T6's own stars.
- **No status bar.** The app draws no status bar (d-089), so the
  side-by-side shows a blank band at the top.
- **Square screen corners (device chrome).** Figma draws the iPad's
  screen with rounded corners (the device frame); the app draws square
  corners, as it draws no device chrome (d-089, review T01 F3).
- **Thin icons (Icon stroke weight).** Figma draws the back chevron, the
  model chips' chevrons and the composer's paperclip with a 2 px stroke
  at their own size, so they look heavy; the icon set draws a 2 px
  stroke in a 24 px box and takes no stroke weight, so at 12 to 20 px
  they look thinner and lighter (review T06 F2, F3).
- **The model chip's chevron is grey (Model chip chevron).** Figma draws
  it in the text colour, as the chip's label; `ModelChip` draws its own
  chevron in a muted grey and takes no tone (review T06 F2).
- **Erik's message is larger (Message text).** Figma draws it in Geist
  13 on a 19 px line; `Message from="user"` draws `body` (14/20), so it
  is about 7% wider (review T06 F1).
- **Actions still to build.** Attach, the attachment's ×, Stop and Send
  draw only, as in M17.
- **No exceptions.**
