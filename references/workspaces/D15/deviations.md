# D15 deviations

What still differs from Figma after the first build of the Fork dialog
(`pnpm fidelity workspaces D15`, 2026-11-17, library 1.0.0-beta.20), each
with its reason. The library gaps are in
`web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is D2b's sidebar
layout without the side chat and the menu: bridge themes alone in the
middle, and the Fork form (`ForkDialog`, `Dialog size="lg"`, 540) open over
it (`forkDialog`, `ui.chatDialog: 'fork'`).

## Checks

- Text: pass. Every Figma string shows, the name field's value
  `bridge themes · fork` included. `Artifacts` and `Toolkit` (rail,
  d-105) are excepted as on D01 to D14.
- Position: 25 of 29 layers pass; `417:261`, `417:274`, `417:393` and
  `417:386` fail. The dialog (`417:305`), the name field (`417:312`), the
  start-from field (`417:319`), both choices (`417:323`, `417:327`) and
  Fork (`417:388`) pass.
- Rules: pass.

## Deviations

- **Note under the choice (Message text).** `417:393` h +5: the line "The
  fork copies the messages and the context. The original keeps running."
  is `bodySm` (13/20); Figma's text box is 15 high. The library keeps line
  heights on the 4 px grid, and no text style has a 15 px line.
- **Cancel and Fork sit lower.** `417:386` y +4.5: the buttons follow the
  note, which is 5 px taller (above), at Figma's 16 px gap. Fork
  (`417:388`) is within the tolerance.
- **Main chat reply.** `417:261` h +7: the reply wraps in body text
  (14/20) and Copy is 24 px (Figma 22), as on D01, D02 and D02b (Message
  text).
- **Composer is lower.** `417:274` y +12, h +7: Figma's D15 puts the
  composer 35 px above the bottom, where D2b put it 16 above; the shared
  `ChatPane` keeps D2b's place, so the composer's bottom is 19 px lower.
  Its height is `Composer`'s attachment chip, 20 px text line and 28 px
  buttons, 7 px taller than Figma's, as on D02b.
- **Name hint (Field hint).** Figma puts "you can rename it later" inside
  the name field at its end; `TextField` has no end slot, so the hint is
  at the end of the NAME label row, about 20 px higher.
- **Field labels (Form field label).** NAME and START FROM are `eyebrow`
  spans 6 px above the control, against Figma's 8.
- **Whole chat and Up to a message… (Runs in choice).** The choices are
  `Button size="lg"` (36 px) against Figma's 39, with the label in Medium
  14 (`label`) against Regular 14.
- **Focus.** Figma draws no focus ring. The dialog box itself takes the
  focus when it opens (`initialFocus`), so no control shows a ring; Ark
  would otherwise focus the close button.
- **Chat header and group headers (Chat header, Sidebar group header).**
  As on D02b: the ⋯ is a `Button size="xs"` (24 px) against 30 × 22, and
  the group header buttons are 24 px with 12 px icons.
- **Attachment remove × (Composer attachment remove).** Figma's × on
  theme-ideas.md is bold; `Composer` draws its own thin `CloseIcon`.
- **Rail.** The shared `AppRail` adds Artifacts and Toolkit before More
  (d-105), so More sits lower than Figma's.
