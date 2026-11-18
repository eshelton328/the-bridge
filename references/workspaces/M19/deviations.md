# M19 deviations

What still differs from Figma M19 · Forked chat (the fork full screen on
the phone, `phoneForkedChat`), after the last fidelity run
(`pnpm fidelity workspaces M19`, 2026-11-18, library 1.0.0-beta.36),
each with its reason. The library gaps are in
`web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is M17's
`PhoneChat` (`ChatHead size="phone"` over `ChatPane size="phone"`) in
`AppShell size="phone" view="detail"` with no tab bar, for the fork:
"bridge themes · fork" over "omni-brain · forked" (the head's `origin`),
Idle, so the composer has no Stop, nothing typed, the focus in the message
box (Figma draws the composer's border cyan, as in M17), and D16's `event`
entry, "Forked from bridge themes here", under the copied messages. Back
returns to the list, where the fork is under bridge themes with D16's
branch mark (`WorkspacesPhoneForkedChat.test.tsx`).

## Checks

- Text: pass. Every Figma string shows; no extra text.
- Position: fail, 4 of 6 layers pass: the header (`422:334`), the back
  button (`422:336`), the ⋯ (`422:347`) and Erik's message (`422:363`).
  Two fail, as in M17:
  - `422:368` (Claude's reply): h +9.
  - `422:381` (the composer): y -12, h +7.
- Rules: pass.

Render minus Figma, in px. All three checks render the page 38 px
shorter, below Figma's status bar (d-102), and the position check adds
38 to each render y (d-101).

## Deviations

- **Claude's reply is 9 px taller (Message text), `422:368` h +9.**
  `Message` draws the reply in `body` (14/20) and the name in `label`
  (14/500) and takes no size; Figma draws Geist 13 on a 19 px line and the
  name at 12. The reply's three lines are 60 high against 57, and its
  text is about 5% wider. Erik's message is 2 px taller for the same
  reason, and the lines under it move down by up to 12 px: the fork line
  "Forked from bridge themes here" is at about 361 against Figma's 349.
  Copy (422:374) is about 67 × 24 against Figma's 63 × 22: no button size
  is 22 and no label style is Medium 11.
- **The composer is 7 px taller and starts 12 px higher (Composer text,
  Phone safe area), `422:381` y -12, h +7.** `Composer` draws its text in
  `body`, so the box is 112 high against Figma's 105. Figma ends the
  composer 8 above its 21 px home indicator band; `AppShell` keeps a 34 px
  safe area under the detail when there is no tab bar, so the composer
  ends 5 px higher. Both push its top up: 698 against 710.
- **The header is 4 px taller (Chat header, Chat header text).** The title
  is `subtitle` (17/24) against Figma's SemiBold 16 at 21, and the model
  chip is 26 high against 22, so the header is 83 high against 79; the
  entries below move 4 px down, within the tolerance.
- **The ⋯ is lighter (Chat header).** Figma's ⋯ is a heavy 18 px icon in
  the text colour; the icon set has no 18 px size and draws `MoreIcon`
  thin, so it is a 20 px `MoreIcon` in a 24 px text button.
- **The attachment chip is 26 high with thin icons (Composer attachment
  remove).** Figma's chip (422:382) is 140 × 22 with a heavy paperclip
  and ×; `Composer` draws its own chip, about 141 × 26, with a thin
  paperclip and a 12 px `CloseIcon`.
- **A dimmer composer border.** The message box has the focus, as Figma's
  cyan border shows; the focused `Composer` draws its own border colour, a
  darker cyan than Figma's.
- **The stars sit elsewhere (Backdrop stars).** `Backdrop size="phone"`
  draws the Inbox phone frame's stars at fixed places, not M19's.
- **Status bar and home indicator.** Figma draws a 38 px status bar
  (9:41), the home indicator and the frame's rounded corners; the app
  draws none (d-089), so the side-by-side shows a blank band at the top.
- **Actions still to build.** As in M17: attach, the attachment's ×, Send,
  the model chip and Copy draw only (R12, R15, R16). Fork in M18's sheet
  does not open this fork yet; the state shows the fork as Fork would
  open it.
- **No exceptions.**
