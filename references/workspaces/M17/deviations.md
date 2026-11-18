# M17 deviations

What still differs from Figma M17 · The chat fills the screen (bridge
themes open full screen on the phone, `phoneChatFull`), after the last
fidelity run (`pnpm fidelity workspaces M17`, 2026-11-18, library
1.0.0-beta.36), each with its reason. The library gaps are in
`web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is M3's
`PhoneChat` (`ChatHead size="phone"` over `ChatPane size="phone"`) in
`AppShell size="phone" view="detail"` with no tab bar, the skills closed
and the focus in the message box (`ui.messageFocus`). Back returns to the
list, where the other chats keep running
(`WorkspacesPhoneChatFull.test.tsx`).

## Checks

- Text: pass. Every Figma string shows, "/" and "Stop" included; no extra
  text.
- Position: fail, 4 of 6 layers pass: the header (`402:10773`), the back
  button (`402:10775`), the ⋯ (`402:10786`) and Erik's message
  (`402:10802`). Two fail, as in M03:
  - `402:10807` (Claude's reply): h +9.
  - `402:10833` (the composer): y -10, h +7.
- Rules: pass.

Render minus Figma, in px. All three checks render the page 38 px
shorter, below Figma's status bar (d-102), and the position check adds
38 to each render y (d-101).

## Deviations

- **Claude's reply is 9 px taller (Message text), `402:10807` h +9.**
  `Message` draws the reply in `body` (14/20) and the name in `label`
  (14/500) and takes no size; Figma draws Geist 13 on a 19 px line and the
  name at 12. The reply's three lines are 60 high against 57, and its text
  is about 5% wider, so "a" moves down to the second line and "sessions"
  to the third: the render's lines end with "and", "long" and "desktop"
  against Figma's "and a", "sessions" and "desktop". Erik's message
  (402:10803, Regular 13 on 19) is 2 px taller and its first line about 7%
  wider for the same reason, and the name "Claude" (402:10811, SemiBold
  12) is 46 wide against 41. Copy (402:10813) is about 67 × 24 against
  Figma's 63 × 22, as in M03: no button size is 22 and no label style is
  Medium 11.
- **The composer is 7 px taller and starts 10 px higher (Composer text,
  Phone safe area), `402:10833` y -10, h +7.** `Composer` draws its text
  in `body` and Stop as `Button size="sm"` (14 px label, 16 px icon), so
  the box is 112 high against Figma's 105 and Stop is about 67 wide
  against 61. Figma ends the composer 10 above its 21 px home indicator
  band; `AppShell` keeps a 34 px safe area under the detail when there is
  no tab bar, so the composer ends 3 px higher. Both push its top up: 698
  against 708.
- **The header is 4 px taller (Chat header, Chat header text).** Its 1 px
  rule is Figma's (402:10800, `border.default` in both). The title
  is `subtitle` (17/24) against Figma's SemiBold 16 at 21, and the model
  chip is 26 high against 22, so the header is 83 high against 79; the
  entries below move 4 px down, within the tolerance.
- **The back chevron is thinner and the ⋯ lighter (Chat header).** The
  back chevron (402:10775) is a 2 px stroke at 20 px in Figma;
  `ChevronLeftIcon` draws the same path in a 24 px box with stroke 2 and
  takes no stroke prop, so at 20 px its stroke is about 1.7 px. Figma's ⋯
  is a heavy 18 px icon in the text colour; the icon set has no 18 px size
  and draws `MoreIcon` thin, so it is a 20 px `MoreIcon` in a 24 px text
  button.
- **The attachment chip is 26 high with thin icons (Composer attachment
  remove).** Figma's chip (402:10834) is 140 × 22 with a heavy paperclip
  and ×; `Composer` draws its own chip, about 141 × 26, with a thin
  paperclip and a 12 px `CloseIcon`.
- **No caret, and a dimmer border.** Figma draws the caret after "/"
  (402:10843). The message box has the focus (its border is cyan), but
  the screenshots hide the caret. The focused `Composer` draws its own
  border colour, a darker cyan than Figma's.
- **The stars sit elsewhere (Backdrop stars).** `Backdrop size="phone"`
  draws the Inbox phone frame's stars at fixed places, not M17's.
- **Status bar and home indicator.** Figma draws a 38 px status bar
  (9:41), the home indicator and the frame's rounded corners; the app
  draws none (d-089), so the side-by-side shows a blank band at the top.
- **Actions still to build.** As in M03: attach, the attachment's ×,
  Stop, Send, the model chip and Copy draw only (R12, R15, R16).
- **No exceptions.**
