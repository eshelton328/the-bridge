# T11 deviations

What still differs from Figma T11 · Subtask running (a subtask running
from the chat on the iPad mini, `tabletSubtaskRunning`), after the last
fidelity run (`pnpm fidelity workspaces T11`, 2026-11-18, library
1.0.0-beta.39), each with its reason. The library gaps are in
`web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is T6's
`PhoneChat` at the tablet's width (`device="tablet"`, with `tabletList`):
`ChatHead size="full"` over `ChatPane size="tablet"`, still Working, with
D18's line where the subtask started (an `event` entry, drawn as the
library's `ToolLine`) under Claude's reply. The composer is empty, with
the focus and Stop, as in M21. Subagents in the ⋯ menu counts 3 (D18's
chat actions), and Back returns to the list, where layout notes is D18's
nested row under bridge themes, Running. The chat has no tab bar, so the
render has no Artifacts tab, and no exception is needed.

## Checks

- Text: pass. Every Figma string is in the render and visible, "Stop"
  included; the render has no extra text.
- Position: fail, 5 of 7 layers pass: the header (`420:1060`), the back
  button (`420:1062`), the ⋯ (`420:1073`), Erik's message (`420:1089`)
  and the subtask line (`420:1129`). Two fail:
  - `420:1094` (Claude's reply with Copy): h +8.
  - `420:1106` (the composer): y +30.
- Rules: pass.

## Deviations

- **The composer sits at the screen's end (Tablet safe area),
  `420:1106` y +30.** Figma ends T11's composer 33 over the screen's end
  (y 1125 of 1158). `AppShell size="tablet"` keeps no safe area under
  the detail when there is no tab bar, so the composer ends at the
  screen's end, as on T02b, T06, T08 and T09. It is measured again
  after the rebase on library beta.42.
- **Claude's reply is taller (Message text), `420:1094` h +8.**
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
  draws the library's fixed star field, not T11's own stars.
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
  M21.
- **No exceptions.**
