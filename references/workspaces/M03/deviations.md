# M03 deviations

What still differs from Figma M3 · Chat (bridge themes open on the phone,
`phoneChat`), after the last fidelity run (`pnpm fidelity workspaces
M03`, 2026-11-17, library 1.0.0-beta.27), each with its reason. The
library gaps are in `web/src/pages/workspaces/LIBRARY_GAPS.md`. The
screen is `WorkspacesPhone` with `ui.phoneView: 'chat'`: `PhoneChat`
(`ChatHead size="phone"` over `ChatPane size="phone"`) in
`AppShell size="phone" view="detail"` with no tab bar.

## Checks

- Text: pass. Every Figma string shows, the skills and "Stop" included;
  no extra text.
- Position: fail, 5 of 7 layers pass: the header (`105:2748`), the back
  button (`105:2750`), the ⋯ (`105:2765`), Erik's message (`105:2785`) and
  the skill list (`105:2805`). Two fail:
  - `105:2790` (Claude's reply): h +9.
  - `105:2820` (the composer): y -10, h +7.
- Rules: pass.

## Deviations

- **Claude's reply is 9 px taller (Message text), `105:2790` h +9.**
  `Message` draws the reply in `body` (14/20) and the name in `label`
  (14/500) and takes no size; Figma draws Geist 13 on a 19 px line and the
  name at 12. The reply's three lines are 60 high against 57, and its
  text is about 5% wider. Erik's message is 2 px taller for the same
  reason, and its first line about 7% wider. Copy under the reply
  (105:2797) is 22 high in Figma, padded 8 and 3 with "Copy" in Geist
  Medium 11; `Button size="xs" textSize="xs"` is 24 high with `labelXs`
  (12/16), so Copy is about 67 × 24 against 63 × 22, as on the desktop
  (no button size is 22 and no label style is Medium 11).
- **The composer is 7 px taller and starts 10 px higher (Composer text,
  Phone safe area), `105:2820` y -10, h +7.** `Composer` draws its text
  in `body`, so the box is 112 high against Figma's 105. Stop draws
  Figma's 12 px icon and a 12 px label, the 4 px grid's size for Figma's
  11 (`stopIconSize`, `stopTextSize`, library beta.80, d-100), 61 × 28
  against Figma's 61 × 26. Figma ends the composer 10 above its 21 px
  home indicator band (31 from the screen's end); `AppShell` keeps a 34
  px safe area under the detail when there is no tab bar, so the
  composer ends 3 px higher. Both push its top up: 698 against 708. The
  skill list sits over the composer and keeps Figma's place within 1 px.
- **The header is 4 px taller (Chat header, Chat header text).** The title
  is `subtitle` (17/24) against Figma's SemiBold 16 at 21, and the model
  chip is 26 high against 22, so the header is 83 high against 79. The
  rows sit 4 apart, as in the chat alone, so the second row stays where
  Figma draws it; the entries below move 4 px down, within the tolerance.
- **The ⋯ is lighter (Chat header).** Figma's ⋯ is a heavy 18 px icon in
  the text colour; the icon set has no 18 px size and draws `MoreIcon`
  thin, so it is a 20 px `MoreIcon` in a 24 px text button that reaches
  2 px into the header's end padding. The back button reaches 2 px out on
  each side, so the chevron is centred where Figma's is (105:2750) and the
  kind mark and title start at x 44 and 72, as in Figma.
- **The highlighted skill's name is white (Skill picker).** Figma draws
  /writer in the accent colour on the filled row; `OptionList
  selectedFill` fills the row and keeps the name in `fg.default`.
- **Skill list width (Skill picker, 2026-11-18).** Known difference
  (D1). The list is `Popover width="trigger"`, as wide as the composer:
  358, as Figma's (it was `width="lg"`, 360). Reason: Erik's comment of 2026-11-18 in the-bridge-review.md (R8): the skill list grows with the composer.
- **The attachment chip is 26 high with thin icons (Composer attachment
  remove).** Figma's chip (105:2821) is 22 high: padded 8 and 3, a heavy
  12 px paperclip, the name in Geist Medium 11 and a heavy 11 px ×.
  `Composer` draws its own chip, 26 high (about 141 × 26 against
  140 × 22), with a thin outline paperclip and a 12 px `CloseIcon`, and
  takes no chip size or icon weight (the icon set has no stroke weight).
- **No caret.** Figma draws the caret after "/" (105:2830). The message
  box has the focus (its border is cyan), but the screenshots hide the
  caret.
- **The composer's border is dimmer than Figma's.** The focused
  `Composer` draws its own border colour, which is a darker cyan than
  Figma's.
- **Status bar and home indicator.** Figma draws a 38 px status bar
  (9:41), the home indicator and the frame's rounded corners; the app
  draws none (d-089), so the side-by-side shows a blank band at the top.
- **Actions still to build.** The ⋯ draws only; its chat actions sheet
  is M04. Attach, the attachment's ×, Stop, Send and the model chip draw
  only (R12, R15), as on the desktop. "/" opens and closes the skill list
  (R13); a pick does not insert the skill yet. Copy (R16) draws only.
- **No exceptions.**
