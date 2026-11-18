# M23 deviations

What still differs from Figma M23 · Rename chat (the chat full screen on
the phone after Erik picks Rename in the chat actions sheet,
`phoneRenameChat`), after the last fidelity run
(`pnpm fidelity workspaces M23`, 2026-11-18, library 1.0.0-beta.36), each
with its reason. The library gaps are in
`web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is M17's
`PhoneChat` (`ChatHead size="phone"` over `ChatPane size="phone"`) in
`AppShell size="phone" view="detail"` with no tab bar: bridge themes in
omni-brain, still Working, so the composer has Stop; nothing typed in the
message box. D21's `ChatNameField` (`size="phone"`, 160 wide) takes the
title's place, with the focus in it and "bridge themes" as its text. A tap
outside saves the name in `ui.names`; × undoes the change and closes the
field, as in M2 (`WorkspacesPhoneRenameChat.test.tsx`).

## Checks

- Text: pass. Every Figma string shows; no extra text.
- Position: fail, 5 of 7 layers pass: the header (`422:850`), the back
  button (`422:852`), the ⋯ (`422:863`), Erik's message (`422:879`) and the
  name field (`rename field · chat`, 160 × 28 against 160 × 29). Two fail:
  - `422:884` (Claude's reply): y -1, h +9.
  - `422:897` (the composer): y -12, h +7.
- Rules: pass.

Render minus Figma, in px. All three checks render the page 38 px
shorter, below Figma's status bar (d-102), and the position check adds
38 to each render y (d-101).

## Deviations

- **The name in the field is smaller and its × grey (Rename field).**
  Figma draws the name in SemiBold 16 (422:926) and a light 15 px ×
  (422:929); `SearchField size="sm"` draws its value in 14 px text and its
  clear button grey. The field is 28 high on the 4 px grid against Figma's
  29, within the tolerance.
- **No caret in the field (Rename field).** Figma draws the caret after
  the name (422:927, a 1.5 px rectangle); the field has the focus, but the
  fidelity screenshot shows no caret, as it only blinks in a live browser
  (as in D21 and M2).
- **Claude's reply is 9 px taller (Message text), `422:884` y -1, h +9.**
  `Message` draws the reply in `body` (14/20) and the name in `label`
  (14/500) and takes no size; Figma draws Geist 13 on a 19 px line and the
  name at 12. The reply's three lines are 60 high against 57, and its text
  is about 5% wider, so "a" moves down to the second line and "sessions"
  to the third: the render's lines end with "and", "long" and "desktop"
  against Figma's "and a", "sessions" and "desktop". Copy (422:890) is
  about 67 × 24 against Figma's 63 × 22: no button size is 22 and no label
  style is Medium 11.
- **The composer is 7 px taller and starts 12 px higher (Composer text,
  Phone safe area), `422:897` y -12, h +7.** `Composer` draws its text in
  `body` and Stop as `Button size="sm"` (14 px label, 16 px icon), so the
  box is 112 high against Figma's 105 and Stop is about 67 × 32 against
  Figma's 61 × 26. Figma ends the composer 8 above its 21 px home
  indicator band; `AppShell` keeps a 34 px safe area under the detail when
  there is no tab bar, so the composer ends 5 px higher. Both push its top
  up: 698 against 710.
- **The composer's border is grey.** Figma draws the composer with the
  cyan border of a focused box (as in M22) while the caret is in the name
  field. Only one element can have the focus: the name field has it, so the
  `Composer` draws its resting border.
- **The header is 4 px taller (Chat header, Chat header text).** The
  model chip is 26 high against 22, so the header is 4 px taller than
  Figma's; the entries below move about 4 px down, within the tolerance.
  The 1 px rule under it (Rectangle 422:877) is `border.default` in both.
- **The back chevron is thinner and the ⋯ lighter (Chat header).** The
  back chevron (422:852) is a 2 px stroke at 20 px in Figma;
  `ChevronLeftIcon` draws the same path in a 24 px box with stroke 2 and
  takes no stroke prop, so at 20 px its stroke is about 1.7 px. Figma's ⋯
  is a heavy 18 px icon in the text colour; the icon set has no 18 px size
  and draws `MoreIcon` thin, so it is a 20 px `MoreIcon` in a 24 px text
  button.
- **The attachment chip is 26 high with thin icons (Composer attachment
  remove).** Figma's chip (422:898) is 140 × 22 with a heavy paperclip
  and ×; `Composer` draws its own chip, about 141 × 26, with a thin
  paperclip and a 12 px `CloseIcon`.
- **The stars sit elsewhere (Backdrop stars).** `Backdrop size="phone"`
  draws the Inbox phone frame's stars at fixed places, not M23's.
- **Status bar and home indicator.** Figma draws a 38 px status bar
  (9:41), the home indicator and the frame's rounded corners; the app
  draws none (d-089), so the side-by-side shows a blank band at the top.
- **Actions still to build.** As in M17: attach, the attachment's ×,
  Stop, Send, the model chip and Copy draw only (R12, R15, R16). The new
  name stays in the view's state (`ui.names`) and is not sent anywhere.
- **No exceptions.**
