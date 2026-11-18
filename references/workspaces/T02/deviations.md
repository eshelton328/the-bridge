# T02 deviations

What still differs from Figma T2 · Chat and side chat (M5's side chat with
T2's note, in a sheet over bridge themes on the iPad mini,
`tabletSideChat`), after the last fidelity run (`pnpm fidelity workspaces
T02`, 2026-11-18, library 1.0.0-beta.36), each with its reason. The
library gaps are in `web/src/pages/workspaces/LIBRARY_GAPS.md`. The
screen is M3's `PhoneChat` at the tablet's width (`device="tablet"`,
with `tabletList`) and `ui.sideChatOpen` set: `PhoneSideChat` (`BottomSheet
size="sm"` with no title row) holds `SideChatPanel placement="sheet"
device="tablet"`, and the focus is in its message box. The chat has no
tab bar, so the render has no Artifacts tab. `exceptions.json` accepts
the main composer's two covered strings, as M05's does.

## Checks

- Text: fail. Every Figma string is in the render, but 11 are not
  visible and 2 are extra:
  - Not visible, covered by the sheet's scrim (Tablet side chat sheet):
    `bridge themes` (105:1819), `omni-brain` (105:1820), `Working`
    (105:1824), `Opus 5.5` (105:1835), `42%` (105:1841), `context`
    (105:1842), `Brainstorm layouts for the-bridge that go beyond a
    sidebar and a chat.` (105:1896), `Read
    f-005-the-bridge/requirements.md` (105:1899) and `Three directions: a
    tiled home, a star map of agents, and a split-pane workbench. The
    workbench suits long sessions on the desktop.` (105:1905). Figma draws
    no scrim on T2, so its chat stays readable above the sheet; the
    library's `BottomSheet` always dims the page under it.
  - Not visible: `Claude` (105:1935) and `Copy` (105:1942), the side
    answer's name and Copy. Each string shows twice in Figma, once in the
    main chat and once in the sheet; the main chat's pair is under the
    scrim, so the check finds one visible occurrence for two layers.
  - Extra: `Stop` and `Message, or / for a skill`, the main chat's
    composer. It stays at the bottom of the chat (d-107), under the sheet,
    which covers it whole; the text check counts a covered run as extra
    text. `exceptions.json` accepts both, with M05's reason.
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

- **The chat above the sheet is dimmed (Tablet side chat sheet), the 11
  not visible strings above.** Figma's tablet sheet (105:1914) has no
  scrim, so the header and the transcript keep their full colour.
  `BottomSheet` always draws `overlay.scrim` under the sheet, and a page
  may not target its classes, so the chat shows dimmed behind it.
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
  the scrim and Escape close the sheet, and Side chat in the chat actions
  sheet opens it again.
