# M11 deviations

What still differs from Figma M11 · New chat, keyboard open (the New chat
form on the phone while Erik types its name, `phoneNewChatKeyboard`),
after the last fidelity run (`pnpm fidelity workspaces`, 2026-11-18,
library 1.0.0-beta.30), each with its reason. The library gaps are in
`web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is M7's
`PhoneNewChat` with `ui.keyboardOpen`: Cancel and the title in a
`ScrollFrame` header, `NewChatFields` in the body and Start chat alone in
the footer. The name field has the focus with "theme tokens" typed, so its
hint is gone; Runs in has Claude Code and Codex; the folders are one box,
"~/omni-brain +1".

## Checks

- Text: passes. Every Figma string shows; four render strings are extra,
  because the screen keeps its full height under the keyboard. Each is
  covered by the system keyboard in Figma and excepted in
  `exceptions.json` (Erik approved them on 2026-11-19):
  - `MODEL`: covered by the system keyboard in Figma.
  - `Sonnet 5.5 · high effort`: covered by the system keyboard in Figma.
  - `FIRST MESSAGE`: covered by the system keyboard in Figma.
  - `What should it do? Type / for a skill.`: covered by the system
    keyboard in Figma.

  The exceptions stay until the screen sizes itself to the visible area
  (Phone keyboard), as the render has no keyboard over them.
- Position: fail, 10 of 14 layers pass: the header (`147:199`), Cancel
  (`147:200`), the title (`147:202`), the name field and its box
  (`147:206`, `147:211`), Runs in and its two rows (`147:214`, `147:216`,
  `147:223`) and the workspace field and box (`148:76`, `148:78`). Four
  fail:
  - `148:80` (the folders field): y +6, h +3.
  - `148:82` (the folders box): y +7, h +2.
  - `147:230` (the start bar): y +350.
  - `147:231` (Start chat): y +352.
- Rules: pass.

## Deviations

- **No keyboard; the screen keeps its full height (Phone keyboard),
  `147:230` y +350, `147:231` y +352, text `MODEL`,
  `Sonnet 5.5 · high effort`, `FIRST MESSAGE`,
  `What should it do? Type / for a skill.`.** Figma draws the iOS keyboard
  and Safari's form bar over the lower 380 points (148:2, design-only
  chrome, d-089, so its text is excluded) and sizes the page to the 426
  points above it: Start chat rides 6 under the fields' end at 404, and
  the model and the first message are a scroll away. The library's
  `AppShell` is as tall as its parent and has no prop for the visible area
  that Safari reports, and the app may not set a measured height (no
  inline style or raw value), so the render keeps the full height: the
  model and the first message show under the folders, and the start bar
  sits at the bottom of the screen over the 34 px safe area, where Figma
  has the keyboard. The bar is 56 high against 60: the safe area, not
  8 px of padding, is under it, and the bar pads 4 under Start chat so
  the footer does not cut its focus ring (as in M07). Start chat is
  `Button size="xl"` (44) against Figma's 46. The first message box still
  draws `Composer`'s send button (Composer in a form, as in M07).
- **The fields are 2 px taller, so the folders sit 6 to 7 px lower (Select
  field, Form field label, Runs in choice), `148:80` y +6, h +3, `148:82`
  y +7, h +2.** The name, workspace and folders boxes and the Runs in rows
  are 44 px (`size="xl"`) against Figma's 42, and each label is `eyebrow`,
  16 high and 6 above its box, against 13 high and 8 above; the fields are
  16 apart, as Figma's. The Runs in rows are 4 apart against Figma's 8, so
  Runs in keeps Figma's height and the drift comes from the name and the
  workspace fields (+3 each).
- **The workspace box has a chevron (Select field).** Figma's omni-brain
  box (148:78) draws the text alone; `SelectField` keeps its chevron, as
  in M07, since the box still opens the workspaces.
- **The folders box text is Medium 14 (Select field).** "~/omni-brain +1"
  (148:83) and "omni-brain" are in `label` (Medium 14) against Figma's
  Regular 14; the two spaces before "+1" are kept. The box is a secondary
  `Button`; it does nothing yet.
- **No caret.** Figma draws the caret after "theme tokens" (147:213, a
  rectangle, not text). The name field has the focus (its border is cyan)
  with the caret at the end, but the screenshots hide the caret.
- **The chosen Runs in row's border is lighter (Selected toggle
  border).** As in M07: Figma draws Claude Code's border (147:216) in
  opaque #5ee1ff; a pressed `Button` draws `border.active` (0.7), and no
  selected-border token is opaque.
- **The Codex mark keeps its colour.** Figma dims it; its name is
  `fg.muted`, as Figma's, as in M07.
- **Status bar and home indicator.** Figma draws a 38 px status bar
  (9:41) and the frame's rounded corners; the app draws none (d-089), so
  the side-by-side shows a blank band at the top.
- **Actions still to build.** The app does not measure the keyboard yet:
  `ui.keyboardOpen` comes from the state. Start chat and the folders box
  draw only; Cancel closes the form.
- **Exceptions.** `exceptions.json` excepts the four extra strings
  above (Phone keyboard).
