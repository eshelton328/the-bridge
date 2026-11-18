# M07 deviations

What still differs from Figma M7 · New chat (the New chat form on the
phone, `phoneNewChat`), after the last fidelity run (`pnpm fidelity
workspaces M07`, 2026-11-17, library 1.0.0-beta.25), each with its reason.
The library gaps are in `web/src/pages/workspaces/LIBRARY_GAPS.md`. The
screen is `PhoneNewChat` in the phone's detail with no tab bar: Cancel and
the title in a `ScrollFrame` header, `NewChatFields` (D3's fields, the
Runs in choices stacked) in the body, and the start bar, the summary over
Start chat, as the footer.

## Checks

- Text: pass. Every Figma string shows.
- Position: fail, 14 of 22 layers pass: the header (`105:3273`), Cancel
  (`105:3274`), the title (`105:3276`), the name field and its box
  (`114:11`, `114:16`), Runs in and its three rows (`105:3304`,
  `105:3284`, `105:3291`, `105:3298`), the workspace field and box
  (`105:3314`, `105:3309`), the folders field (`128:24`) and the model
  field and box (`105:3322`, `105:3317`). Eight fail:
  - `128:30` (the ~/the-bridge chip): w -7.
  - `128:34` (the ~/omni chip): x -7.
  - `128:41` (Add folder): x -6.4.
  - `105:3338` (the first message field): h -32.
  - `105:3327` (the first message box): h -33.
  - `147:8` (the start bar): y -7, h -6.
  - `147:9` (the summary line): y -7.
  - `147:10` (Start chat): y -5.
- Rules: pass.

## Deviations

- **The folder chips are narrower, so the next chips start further left
  (Folder chip), `128:30` w -7, `128:34` x -7, `128:41` x -6.4.** The
  paths are in `label` (Geist 14) against Figma's Geist Mono, and the chips
  are 28 px against 30; the × of ~/omni is part of the chip's button. D3
  draws them the same way. Add folder's border is dashed, as Figma's
  (128:41).
- **The first message box is 33 px shorter and has a send button
  (Composer in a form), `105:3327` h -33, `105:3338` h -32.** `Composer`
  sizes its text area to one line (78 px) and always draws the cyan ↑ send
  button at its end; Figma's box is 111 high with only the clip button.
  The space between the box and the start bar is larger by as much.
- **The start bar sits higher and Start chat is shorter (Phone safe
  area), `147:8` y -7, h -6, `147:9` y -7, `147:10` y -5.** `AppShell
  size="phone"` keeps 34 px under the detail for the home indicator, where
  Figma ends the bar 21 px from the screen's end, so the bar ends 13 px
  higher. Start chat is `Button size="xl"` (44) against Figma's 48, and
  the summary is `monoSm` (16 high) against 14.
- **The fields are 2 px taller and 2 px closer together (Runs in choice,
  Select field, Form field label).** The name, Runs in rows, Workspace and
  Model are 44 px (`size="xl"`) against Figma's 42, and the fields are 16
  apart against Figma's 18, which is off the 4 px grid (d-100); each label
  is `eyebrow`, 16 high and 6 above its box, against 13 high and 8 above.
  Every layer is within 4 px.
- **"random if blank" is on the label row (Field hint).** Figma draws the
  hint inside the name field at its end; `TextField` has no slot there.
- **The values are Medium 14 (Select field, Runs in choice).** The Runs in
  names and the Workspace and Model values are in `label` (Medium 14)
  against Figma's Regular 14, and the Codex and shell marks keep their
  colour where Figma dims them; their names are `fg.muted`, as Figma's.
- **Cancel is a text button whose box reaches 8 px before the word.** The
  word carries the layer and sits where Figma's does.
- **No home indicator.** The app draws no status bar or home indicator
  (d-089), so the side-by-side shows a blank band at the top.
- **What the form does not do yet.** Cancel closes it and shows the
  workspaces; Start chat, Add folder, the folder × and the choices do not
  change the data yet, and nothing on the phone list opens the form (+ is
  New chat or workspace, a later frame).
