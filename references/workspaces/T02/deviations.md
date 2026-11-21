# T02 deviations

What still differs from Figma T2 · Chat and side chat (M5's side chat with
T2's note, in a sheet over bridge themes on the iPad mini,
`tabletSideChat`), after the last fidelity run (`pnpm fidelity workspaces
T02`, 2026-11-18, library 1.0.0-beta.65), each with its reason. The
library gaps are in `web/src/pages/workspaces/LIBRARY_GAPS.md`. The
screen is M3's `PhoneChat` at the tablet's width (`device="tablet"`,
with `tabletList`) and `ui.sideChatOpen` set: `PhoneSideChat`
(`BottomSheet size="sm" scrim={false}` with no title row) holds
`SideChatPanel placement="sheet" device="tablet"`, and the focus is in
its message box. The chat has no
tab bar, so the render has no Artifacts tab. `exceptions.json` accepts
the main composer's two covered strings, as M05's does; this run needs
neither (see Text).

## Checks

- Text: pass. All 19 Figma strings are in the render and visible, with
  no extra text. The sheet draws no scrim (`BottomSheet scrim={false}`,
  library #198, 1.0.0-beta.65), so the chat's header and transcript
  above it, and the main chat's `Claude` and `Copy`, are no longer
  covered. The run counts no extra text, so `exceptions.json`'s two
  entries (the main composer's `Stop` and `Message, or / for a skill`
  under the sheet) match nothing (`excepted: 0`, as on main before this
  change); the check does not report an unused exception, so they stay.
- Position: fail, 4 of 10 layers pass: the header (`105:1810`), the back
  button (`105:1812`), the ⋯ (`105:1827`) and Erik's message
  (`105:1895`). Six fail:
  - `105:1900` (Claude's reply in the main chat): h +8.
  - `105:1917` (the side chat's title row): y +193.
  - `105:1928` (the note): y +195.
  - `105:1929` (Erik's side question): y +196.
  - `105:1931` (Claude's side answer): y +197, h +27.
  - `105:1944` (the side composer): y -9.
- Rules: pass.

## Deviations

- **The sheet is shorter and starts much lower (Tablet side chat
  sheet), `105:1917` y +193, `105:1928` y +195, `105:1929` y +196,
  `105:1931` y +197.** Figma's sheet is 560 high from y 598 to the
  screen's end, with an empty space between the answer and the composer.
  `BottomSheet` is as high as its content and no size token gives 560, so
  the title row starts at about y 817 against 624, and nothing is empty
  above the composer. The main chat's empty space above the sheet is
  larger by as much.
- **The side composer sits 9 px higher (Tablet side chat sheet),
  `105:1944` y -9.** Figma ends it 29 over the screen's end;
  `BottomSheet` keeps 34 (`shell.safeAreaBottom`) under its content, and
  the composer is 78 high against Figma's 75.
- **Claude's answers are taller and the side answer wraps to two lines
  (Message text), `105:1931` h +27, `105:1900` h +8.** `Message` draws
  the text in `body` (14/20) and the name in `label` against Figma's
  Geist 13 on a 19 px line and SemiBold 12, so "token variables." moves
  to a second line in the sheet and the main reply's two lines are 20
  high each; Erik's messages are about 7% wider.
- **The note is 1 px taller.** Figma draws it in Geist 13 on a 19 px
  line (105:1928); the render uses `bodySm` (13/20), on the 4 px grid
  (d-100).
- **The header is 2 px taller (Chat header, Chat header text).** The
  title in `subtitle` (17/24) over `monoSm` is 40 high against Figma's
  37 and the model chip 26 against 22; the header with its rule is 91
  high against 89, within the tolerance.
- **The transcript sits 24 in from the sides, Figma's 22, and its entries
  12 apart, Figma's 14,** on the 4 px grid; the boxes are within the
  tolerance.
- **The ⋯ is lighter and the bubble and × are 20 px (Chat header, Phone
  side chat sheet).** As in M05: a thin 20 px `MoreIcon` against Figma's
  heavy 18 px icon, and the icon set has no 18 px size.
- **The side composer's border is a lighter cyan.** Figma draws the
  focused composer with a solid cyan border; the library's focused
  `Composer` draws its own focus border, cyan at half alpha.
- **The stars sit elsewhere (Backdrop stars).** `Backdrop size="tablet"`
  draws the library's fixed star field, not T2's own stars.
- **No status bar.** The app draws no status bar (d-089), so the
  side-by-side shows a blank band at the top.
- **Square screen corners (device chrome).** Figma draws the iPad's
  screen with rounded corners (the device frame) and the side chat
  sheet's bottom corners with it; the app draws square corners, as it
  draws no device chrome (d-089, review T02 F2).
- **The side composer's placeholder is larger (Composer text).** Figma
  draws "Ask a side question" in Geist 13; `Composer` draws it in `body`
  (14/20) and takes no text size, so it is 125 wide against 116 (review
  T02 F1).
- **Thin icons (Icon stroke weight).** Figma draws the back chevron (20
  px, cyan) and the model chip's chevron with a 2 px stroke at their own
  size, so they look heavy; the icon set draws a 2 px stroke in a 24 px
  box and takes no stroke weight, so at 12 to 20 px they look thinner
  and lighter (review T06 F2).
- **The model chip's chevron is grey (Model chip chevron).** Figma draws
  it in the text colour, as the chip's label; `ModelChip` draws its own
  chevron in a muted grey and takes no tone (review T02b F2).
- **Erik's message is larger (Message text).** Figma draws it in Geist
  13 on a 19 px line; `Message from="user"` draws `body` (14/20), so it
  is about 7% wider (review T06 F1).
- **What the side chat does not do yet.** The composer does not send; ×,
  a press on the chat above the sheet and Escape close the sheet, and Side chat in the chat actions
  sheet opens it again.
- **Scroll to the newest message (Erik's request, 2026-11-21).** Erik
  asked for "a button to scroll you all the way down to the bottom of the
  chat ... centered in the width and above the message box". Figma draws
  no such button. In a live chat, more than a screen above the end of the
  transcript, an icon-only library button with a down arrow floats 8 above
  the transcript's bottom, centred on its width, with a dot when new entries
  came in; a tap scrolls to the end and hides it (`blocks/NewestButton.tsx`,
  LIBRARY_GAPS.md: Scroll to newest). This frame's fixture chats are not
  live and sit at their own scroll, so its render does not change.
- **Live tool calls (review R32, a frame exception the app owns).** Erik
  wrote: "these tool messages aren't great like send message bash macro
  etc. how can we improve that". Figma draws a tool call as a tool line:
  a status dot and the tool's name and target in mono, `fg.muted`
  (105:1899). A live call from a server with backend #371 keeps that line's
  mono, colour and 6 px gaps, but draws its kind's icon in the dot's place
  and state colour, a readable title in place of the raw name and its own
  one-line label in `fg.subtle` in place of the target; a run of two or
  more calls draws as one `ToolLine` with a summary of its kinds and
  counts, which a tap opens (`blocks/ToolRow.tsx`, `blocks/ToolGroup.tsx`;
  LIBRARY_GAPS.md: Tool row icon and label, Tool group row). Figma draws no
  icon, title, label or group. This frame's fixture calls have no kind, so
  they draw as before and its render does not change.
