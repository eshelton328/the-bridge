# T14 deviations

What still differs from Figma T14 · Rename chat (the chat full screen on
the iPad mini after Erik picks Rename chat in the chat actions menu,
`tabletRenameChat`), after the last fidelity run
(`pnpm fidelity workspaces T14`, 2026-11-18, library 1.0.0-beta.42),
each with its reason. The library gaps are in
`web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is T6's
`PhoneChat` at the tablet's width (`device="tablet"`, with `tabletList`):
`ChatHead size="full"` over `ChatPane size="tablet"`, bridge themes in
omni-brain, still Working with Stop, and nothing typed in the message
box. D21's `ChatNameField` (300 wide, as at a desktop width) takes the
title's place, with the focus in it and "bridge themes" as its text. A
tap outside saves the name in `ui.names`; × undoes the change and closes
the field, as in M23 and T1; either gives the focus back to the message
box if it had it before Rename chat (`WorkspacesTabletRenameChat.test.tsx`).
The chat has no tab bar, so the render has no Artifacts tab, and no
exception is needed.

## Checks

- Text: pass. Every Figma string is in the render and visible; the
  render has no extra text.
- Position: fail, 6 of 7 layers pass: the header (`420:1559`, h -2), the
  back button (`420:1561`), the name field (`rename field · chat`,
  300 × 28 against 300 × 29, x -2), the ⋯ (`420:1572`), Erik's message
  (`420:1588`, y -3) and the composer (`420:1605`, y -4, h +3). One
  fails:
  - `420:1593` (Claude's reply with Copy): y -6, h +8.
- Rules: pass.

Render minus Figma, in px. All three checks render the page 29 px
shorter, below Figma's status bar (d-102), and the position check adds
29 to each render y (d-101).

## Deviations

- **The composer ends 1 px higher (Tablet safe area, closed by
  beta.42).** `AppShell size="tablet"` keeps 34 (`shell.safeAreaBottom`)
  under the detail with no tab bar, so the composer ends 34 over the
  screen's end, at y 1124, against Figma's 33 (y 1125 of 1158): y -4,
  h +3, within the tolerance, as on T13.
- **Claude's reply starts 6 px higher and is taller (Message text, Chat
  header text), `420:1593` y -6, h +8.** Figma's header grows 8 with the
  field (the title column is 45 high: the 29 px field, 2 px and the
  14 px workspace), the render's 4 (the 28 px field over the 16 px
  `monoSm` line, against T13's 24 px `subtitle` title), so the header is
  2 px shorter than Figma's where T13's is 2 px taller, and the
  transcript moves up 3. `Message` draws the text in `body` (14/20) and
  the name in `label` against Figma's Geist 13 on a 19 px line and
  SemiBold 12, so the read line and the reply's name take 3 px less
  room over the reply; Copy is 24 high against 22, and the reply wraps
  at another word ("long" moves to the second line), as on T13.
- **The name in the field is smaller and its × grey (Rename field).**
  Figma draws the name in SemiBold 16 (420:1629) and a light 15 px ×
  (420:1632); `SearchField size="sm"` draws its value in 14 px text and
  its clear button grey. The field is 28 high on the 4 px grid against
  Figma's 29, and starts 2 px earlier; within the tolerance.
- **No caret in the field (Rename field).** Figma draws the caret after
  the name (420:1630, a 1.5 px rectangle); the field has the focus, but
  the fidelity screenshot shows no caret, as it only blinks in a live
  browser (as in D21 and M23).
- **The composer's border is grey.** Figma draws the composer with the
  cyan border of a focused box while the caret is in the name field.
  Only one element can have the focus: the name field has it, so the
  `Composer` draws its resting border (the decision recorded on M23).
- **The composer is 3 px taller and Stop is larger (Composer text).**
  `Composer` draws the placeholder in `body` and Stop as
  `Button size="sm"`, so Stop is wider and its label larger than
  Figma's 61 px Stop with an 11 px label; the height is within the
  tolerance.
- **The ⋯ is lighter (Chat header).** As on T06: a thin 20 px
  `MoreIcon` against Figma's heavy 18 px icon; within the tolerance.
- **The transcript sits 24 in from the sides, Figma's 22,** on the 4 px
  grid; within the tolerance.
- **The stars sit elsewhere (Backdrop stars).** `Backdrop size="tablet"`
  draws the library's fixed star field, not T14's own stars.
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
  T11. The new name stays in the view's state (`ui.names`) and is not
  sent anywhere.
- **No exceptions.**
