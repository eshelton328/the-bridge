# M18 deviations

What still differs from Figma M18 · Fork a chat (the Fork sheet over
bridge themes on the phone, `phoneFork`), after the last fidelity run
(`pnpm fidelity workspaces M18`, 2026-11-18, library 1.0.0-beta.36), each
with its reason. The library gaps are in
`web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is M17's
`PhoneChat` with the message box empty and out of focus, under the Fork
sheet (`PhoneFork`: `BottomSheet` with `title` and `closeButton`, D15's
fields in `ForkFields` and a primary Fork), open while `ui.chatDialog` is
`fork`. The chat actions' Fork opens it and × closes it
(`WorkspacesPhoneFork.test.tsx`).

## Checks

- Text: pass. Every Figma string shows, the name field's value
  `bridge themes · fork` and the note included; no extra text.
- Position: fail, 7 of 12 layers pass: the header (`422:141`), the back
  button (`422:143`), the ⋯ (`422:154`), Erik's message (`422:170`), both
  choices (`422:235`, `422:239`) and Fork (`422:300`). Five fail:
  - `422:175` (Claude's reply): h +9, as in M17.
  - `422:188` (the composer): y -12, h +7, as in M17.
  - `422:224` (the name field): y -6.
  - `422:231` (the start-from field): y -6.
  - `422:305` (the note): y -6, h +10.
- Rules: pass.

Render minus Figma, in px. All three checks render the page 38 px
shorter, below Figma's status bar (d-102), and the position check adds
38 to each render y (d-101).

## Deviations

- **The note is 10 px taller, and the fields above it sit 6 px higher
  (Phone fork sheet), `422:305` y -6, h +10; `422:224` y -6; `422:231`
  y -6.** Figma draws "Copies the messages and the context. The original
  keeps running." in Regular 13 on a 15 px line, two lines 30 high; the
  note is `bodySm` (13/20), 40 high, as the library keeps line heights on
  the 4 px grid and has no 15 px line. Fork is 36 high (`Button
  size="lg"`) against Figma's 40, as no button is 40. The sheet grows up
  from the bottom of the screen, so the 10 px and the -4 px add up to the
  name, the choice and the note sitting 6 px higher, and the sheet's top
  edge is higher too.
- **The sheet has a grabber and a smaller title (Phone fork sheet).**
  Figma's sheet has no grabber, and its title "Fork bridge themes" is
  SemiBold 20 with an 18 px ×. `BottomSheet` always draws the grabber,
  draws its `md` title in `subtitle` (17/24) and its close button as a
  28 px button with a 16 px ×, and takes no title size.
- **Fork's arrow is 16 px.** Figma's up arrow is 14 px (422:301); the
  icon set has no 14 px size. Its label is Figma's Geist Medium 12
  (422:304, `textSize="xs"`).
- **The choices are 3 px shorter, and Up to a message… is brighter (Runs
  in choice).** Whole chat and Up to a message… are `Button size="lg"
  textSize="sm"` (36 px, Medium 13 as Figma's 422:238 and 422:244)
  against Figma's 39. Figma draws the unchosen label in `fg.muted`
  (#8a97b8); a secondary `Button` draws an unpressed label in
  `fg.default` and has no option to mute it, so it reads near-white.
  Whole chat is `pressed`: Figma draws its border opaque
  #5ee1ff, which is `border.active`, the library's pressed border.
- **Field labels (Form field label).** NAME and START FROM are `eyebrow`
  spans 6 px above the control, against Figma's 8, as in D15.
- **No focus ring.** Figma draws none. The sheet itself takes the focus
  when it opens, as D15's dialog does, so no control shows a ring.
- **Claude's reply is 9 px taller, Erik's message and the name wider
  (Message text), `422:175` h +9.** As in M17: `Message` draws the reply
  and Erik's message in `body` (14/20) and the name in `label` (14/500);
  Figma draws both texts in Geist Regular 13 on a 19 px line (422:171,
  422:180) and the name in SemiBold 12 (422:179). The reply wraps as in
  M17: "a" moves down to the second line and "sessions" to the third: the
  render's lines end with "and", "long" and "desktop" against Figma's
  "and a", "sessions" and "desktop". Erik's first line is about 7% wider
  (323 against 301 px) and his bubble 2 px taller, and "Claude" is 46 wide
  against 41. Copy is about 67 × 24 against Figma's 63 × 22.
- **The composer is 7 px taller and starts 12 px higher (Composer text,
  Phone safe area), `422:188` y -12, h +7.** As in M17: `Composer` draws
  its text in `body` and Stop as `Button size="sm"`, so the box is 112
  high against 105, and `AppShell` keeps a 34 px safe area under it.
  Figma puts M18's composer 2 px lower than M17's (y 710 against 708),
  so the offset is 2 px more than M17's.
- **The header is 4 px taller, the back chevron thinner and the ⋯ lighter
  (Chat header, Chat header text).** As in M17: the title is `subtitle`
  (17/24) against SemiBold 16 at 21, the model chip 26 high against 22,
  and the ⋯ a 20 px `MoreIcon`. The back chevron (422:143) is a 2 px
  stroke at 20 px in Figma; `ChevronLeftIcon` draws the same path in a 24
  px box with stroke 2 and takes no stroke prop, so at 20 px its stroke is
  about 1.7 px.
- **The attachment chip is 26 high with thin icons (Composer attachment
  remove).** As in M17.
- **The stars sit elsewhere (Backdrop stars).** `Backdrop size="phone"`
  draws the Inbox phone frame's stars at fixed places, not M18's.
- **Status bar and home indicator.** Figma draws a 38 px status bar
  (9:41), the home indicator and the frame's rounded corners; the app
  draws none (d-089), so the side-by-side shows a blank band at the top.
- **Actions still to build.** Fork draws only: it makes no copy and
  leaves the sheet open, and Up to a message… does not yet let Erik pick the
  message (R10). The chat's attach, Stop, Send, the model chip and Copy
  draw only, as in M17.
- **No exceptions.**
