# M10 deviations

What still differs from Figma M10 · Chat, keyboard open (bridge themes on
the phone while Erik types, `phoneKeyboard`), after the last fidelity run
(`pnpm fidelity workspaces`, 2026-11-18, library 1.0.0-beta.27), each
with its reason. The library gaps are in
`web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is M3's `PhoneChat`
with `ui.keyboardOpen`: `ChatHead size="phone"` with `meta` (one row) over
`ChatPane size="phone"`, in `AppShell size="phone" view="detail"` with no
tab bar. The message box has the focus and "/wri" before its caret, so
the skill list keeps /writer alone under `data.skillsMatching`.

## Checks

- Text: fail. Every Figma string shows but one:
  - `SKILLS MATCHING /wri` (147:72) is not visible as Figma writes it: the
    render shows "SKILLS MATCHING /WRI", which the check also reports as
    extra text. The fix comes with `PopoverSection query` (library #136,
    1.0.0-beta.30); see Deviations.

  No render string is extra under the keyboard: the skill list and the
  composer, which show where Figma has the keyboard (`147:70`, `147:79`),
  hold only Figma's own strings.
- Position: fail, 3 of 7 layers pass: the header (`147:46`), the back
  button (`147:47`) and the ⋯ (`147:58`). Four fail:
  - `148:84` (Erik's message): y -36, h +2.
  - `147:64` (Claude's reply): y -34, h +7.
  - `147:70` (the skill list): y +352, w +2, h -1.
  - `147:79` (the composer): y +345, h +9.
- Rules: pass.

## Deviations

- **No keyboard; the screen keeps its full height (Phone keyboard),
  `147:79` y +345, `147:70` y +352, `148:84` y -36, `147:64` y -34.**
  Figma draws the iOS keyboard and Safari's form bar over the lower 380
  points (147:97, design-only chrome, d-089, so its text is excluded) and
  sizes the page to the 426 points above it: the composer ends 8 over the
  form bar, the skill list sits over it, and the transcript's newest
  message ends just over the list, so Erik's message starts 48 under the
  header. The library's `AppShell` is as tall as its parent and has no
  prop for the visible area that Safari reports, and the app may not set a
  measured height (no inline style or raw value), so the render keeps the
  full height of the screen: the transcript starts 12 under the header,
  the skill list and the composer sit at the bottom of the screen over
  M3's safe area, and the band where Figma has the keyboard shows the
  backdrop. The skill list and the composer are where the system keyboard
  covers the screen in Figma; they hold only Figma's strings, so the text
  check reports no extra text there.
- **The skill list's label is in capitals (Skill picker), text
  `SKILLS MATCHING /wri`.** Figma draws the label (147:72) in Geist Mono
  Regular 10 with "/wri" in the case Erik typed it. `PopoverSection` shows
  its whole label in capitals, so the render shows "/WRI". The fix comes
  with `PopoverSection query` (library #136, 1.0.0-beta.30, not yet
  released), which keeps the part of the label that `query` names in its
  own case; until then the text check fails on this label, and no
  exception covers it.
  The list is `Popover width="lg"`, 360 wide against Figma's 358 (`147:70`
  w +2), and /writer is white on its filled row where Figma draws it in the
  accent colour, as in M03.
- **The header is one line, 1 px taller (Chat header text).** The title
  is `subtitle` (17/24) over "Opus 5.5 · 42% · 2 folders" in `monoSm`, 40
  high against Figma's 34, so the row pads 4 above and 2 below (Figma 4
  and 8); with its rule the header is 47 high against Figma's 46 plus its
  rule. `147:46` passes. The ⋯ is a thin 20 px `MoreIcon`, as in M03.
- **Claude's reply is 7 px taller and Erik's message 2 px (Message
  text), `147:64` h +7, `148:84` h +2.** `Message` draws the text in
  `body` (14/20) and the name in `label`; Figma draws Geist 13 on a 19 px
  line and the name at 12, so the reply's three lines are 60 high against
  57 and its text is about 5% wider. The reply has no Copy, as in Figma.
- **The composer is 9 px taller (Composer text), `147:79` h +9.**
  `Composer` draws its text in `body` and Stop as `Button size="sm"`, so
  the box with one line of text is 78 high against Figma's 69, and Stop is
  wider than Figma's 61.
- **No caret.** Figma draws the caret after "/wri" (147:82). The message
  box has the focus (its border is cyan), but the screenshots hide the
  caret.
- **Status bar and home indicator.** Figma draws a 38 px status bar
  (9:41) and the frame's rounded corners; the app draws none (d-089), so
  the side-by-side shows a blank band at the top.
- **Actions still to build.** The app does not measure the keyboard yet:
  `ui.keyboardOpen` comes from the state. Attach, Stop, Send and a pick in
  the skill list draw only, as in M03. Typing filters the list by the word
  before the caret that starts with "/".
- **No exceptions.**
