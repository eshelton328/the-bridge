# M22 deviations

What still differs from Figma M22 · Moved (the chat full screen on the
phone after Erik picks a workspace in the chat actions sheet,
`phoneMovedChat`), after the last fidelity run
(`pnpm fidelity workspaces M22`, 2026-11-18, library 1.0.0-beta.36), each
with its reason. The library gaps are in
`web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is M17's
`PhoneChat` (`ChatHead size="phone"` over `ChatPane size="phone"`) in
`AppShell size="phone" view="detail"` with no tab bar: bridge themes, now
in the-bridge, so the header names the-bridge; still Working, so the
composer has Stop; nothing typed and the focus in the message box (Figma
draws the composer's border cyan, as in M17 and M21). D20's `ChatToast`
sits in `ChatPane`'s `above` slot, over the composer, with "Moved to
the-bridge" and Undo, which closes it. Back returns to the list, where
bridge themes and theme tokens head the-bridge
(`WorkspacesPhoneMovedChat.test.tsx`).

## Checks

- Text: pass. Every Figma string shows, "Moved to the-bridge" and "Undo"
  included; no extra text.
- Position: fail, 4 of 7 layers pass: the header (`422:744`), the back
  button (`422:746`), the ⋯ (`422:757`) and Erik's message (`422:773`).
  Three fail:
  - `422:778` (Claude's reply): y +3, h +9.
  - `toast` (the toast, 422:819): x +18.7, y -10, w -37.4 (h -2).
  - `422:791` (the composer): y -12, h +7.
- Rules: pass.

Render minus Figma, in px. All three checks render the page 38 px
shorter, below Figma's status bar (d-102), and the position check adds
38 to each render y (d-101).

## Deviations

- **The toast is narrower and its text smaller (Toast size), `toast` x
  +18.7, y -10, w -37.4.** Figma's toast (422:819) is 213 × 40, its
  message and Undo in 14 px text, 17 px in from each side and 16 px
  between them. The library's `Toast` has one size: 12 px text, 12 px
  sides and an 8 px gap, so it is about 176 × 38. It is centred over the
  composer, as in Figma, and 12 px above it, as in Figma; it is 10 px
  higher only because the composer is 12 px higher (below).
- **Claude's reply is 9 px taller (Message text), `422:778` y +3, h +9.**
  `Message` draws the reply in `body` (14/20) and the name in `label`
  (14/500) and takes no size; Figma draws Geist 13 on a 19 px line and the
  name at 12. The reply's three lines are 60 high against 57, and its text
  is about 5% wider, so "and" moves to the first line. Erik's message is
  2 px taller for the same reason, and the reply starts 3 px lower. Copy
  (422:784) is about 67 × 24 against Figma's 63 × 22: no button size is 22
  and no label style is Medium 11.
- **The composer is 7 px taller and starts 12 px higher (Composer text,
  Phone safe area), `422:791` y -12, h +7.** `Composer` draws its text in
  `body` and Stop as `Button size="sm"` (14 px label, 16 px icon), so the
  box is 112 high against Figma's 105 and Stop is about 67 × 32 against
  Figma's 61 × 26. Figma ends the composer 8 above its 21 px home
  indicator band; `AppShell` keeps a 34 px safe area under the detail when
  there is no tab bar, so the composer ends 5 px higher. Both push its top
  up: 698 against 710.
- **The header is 4 px taller (Chat header, Chat header text).** The
  title is `subtitle` (17/24) against Figma's SemiBold 16 at 21, and the
  model chip is 26 high against 22, so the header is 83 high against 79;
  the entries below move 4 px down, within the tolerance. The 1 px rule
  under it (Rectangle 422:771) is `border.default` in both.
- **The ⋯ is lighter (Chat header).** Figma's ⋯ is a heavy 18 px icon in
  the text colour; the icon set has no 18 px size and draws `MoreIcon`
  thin, so it is a 20 px `MoreIcon` in a 24 px text button.
- **The attachment chip is 26 high with thin icons (Composer attachment
  remove).** Figma's chip (422:792) is 140 × 22 with a heavy paperclip
  and ×; `Composer` draws its own chip, about 141 × 26, with a thin
  paperclip and a 12 px `CloseIcon`.
- **A dimmer composer border.** The message box has the focus, as Figma's
  cyan border shows; the focused `Composer` draws its own border colour, a
  darker cyan than Figma's.
- **The stars sit elsewhere (Backdrop stars).** `Backdrop size="phone"`
  draws the Inbox phone frame's stars at fixed places, not M22's.
- **Status bar and home indicator.** Figma draws a 38 px status bar
  (9:41), the home indicator and the frame's rounded corners; the app
  draws none (d-089), so the side-by-side shows a blank band at the top.
- **Actions still to build.** As in M17 and D20: attach, the attachment's
  ×, Stop, Send, the model chip and Copy draw only (R12, R15, R16). A
  workspace picked in M4's sheet does not open this state yet (D19 does
  not open D20 either), Undo closes the toast without moving the chat
  back, and the toast does not close by itself after a few seconds (R8);
  the state shows the chat as the move would leave it.
- **No exceptions.**
