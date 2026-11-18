# T05 deviations

What still differs from Figma T5 · Folders (bridge themes on the iPad
mini with its folders sheet open, `tabletFolders`), after the last
fidelity run (`pnpm fidelity workspaces T05`, 2026-11-18, library
1.0.0-beta.39), each with its reason. The library gaps are in
`web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is T2b's
`PhoneChat` at the tablet's width with M8's `PhoneFolders
device="tablet"` open on the picker (`ui.foldersOpen`,
`ui.folderPickerOpen`, `ui.pickedFolder`). The chat has no tab bar, so
the render has no Artifacts tab. `exceptions.json` copies T02's two
entries: the main composer's placeholder and Stop are under the sheet,
which covers them whole, and Figma leaves them out.

## Checks

- Text: pass. Every Figma string is in the render and visible; the
  composer's `Message, or / for a skill` and `Stop` are covered by the
  sheet (exceptions.json).
- Position: fail, 2 of 22 layers pass: the header (`128:493`) and
  Erik's message (`128:528`). 20 fail:
  - `128:495` (the back button): x -8.
  - `128:506` (the ⋯): x +6.
  - `128:520` (the folders chip): x -8, w +4.9.
  - `128:530` (Claude's reply): h +5.
  - `128:540` (the sheet's title row): y +66.
  - `128:549`, `128:555` (the folder rows): y +67, y +66.
  - `128:563` (Add folder): y +65.
  - `128:568` (the rule): y +63.
  - `128:569` (Add a folder's title row): y +63.
  - `128:580` (the search): y +67.
  - `128:587`, `128:593`, `128:599` (the recent folders): y +69, +68,
    +67.
  - `128:605`, `128:612`, `128:619`, `128:626` (the folders of ~/): y
    +67, +68, +69, +70.
  - `128:636` (Cancel): x -6.2, y -6.
  - `128:638` (Add ~/the-bridge): x -7.9, y -7, w +7.9.
- Rules: pass.

## Deviations

- **The sheet starts about 66 px lower (Tablet folders sheet),
  `128:540` to `128:626` y +63 to +70.** Figma's sheet is 780 high from
  y 378, with a 67 px spacer over its foot. `BottomSheet` is as high as
  its content, so the sheet starts lower and its top edge, title row and
  every row sit that much lower; inside the sheet the rows are 10 apart
  and 23 in, as Figma's.
- **Cancel and Add sit 6 to 7 px higher, and Add is 8 px wider (Tablet
  folders sheet), `128:636` x -6.2 y -6, `128:638` x -7.9 y -7 w +7.9.**
  The sheet pads 34 (`shell.safeAreaBottom`) under its foot against
  Figma's 27, and `Button size="sm"` pads Add's icon and label more than
  Figma's 137 px button; Cancel is 28 high against 30.
- **The sheet's title row is the page's (Tablet folders sheet).**
  `BottomSheet` takes its title as a string and draws nothing after it,
  so the sheet has a `label` and the page draws Folders (`subtitle`, 17
  px), bridge themes (`mono`) and a grey 20 px × in the frame's header,
  where Figma's × is 18 px.
- **The chat's header sits 4 px further out, `128:495` x -8, `128:506` x
  +6, `128:520` x -8.** T5 draws the header 22 in from the screen's
  sides; T2, T2b, T4 and T6 to T14 draw it 18 in. The app draws one
  tablet chat header (16 in, as T02 to T04 pass), so the back button,
  the ⋯ and the chip sit where the other tablet frames have them. The
  chip is also 88 × 24 against Figma's 83 × 22 (`Button size="xs"`,
  Phone folders sheet), and the ⋯ a thin 20 px `MoreIcon` against
  Figma's heavy 18 px icon (Chat header).
- **Claude's reply is taller (Message text), `128:530` h +5.** `Message`
  draws the name in `label` and the text in `body` (14/20) against
  Figma's SemiBold 12 and Geist 13 on a 19 px line.
- **The search shows a clear × and no caret (Folder picker).**
  `SearchField` draws a clear button while it has text, which Figma's
  focused search (128:580) has not; the field has the focus (its cyan
  border), and the screenshot catches the blinking caret off. Its text
  is in `body` (sans) against Figma's Geist Mono 13.
- **The picker's rows are 32 high (Folder picker, Folder list).** The
  recent folders are 32 against 33, the chosen one 32 against 35, the
  folders of ~/ 32 against 31 and Add folder 28 against 30; within the
  tolerance. The "added" notes and the listed folders' names are larger
  than Figma's.
- **The header is 2 px taller (Chat header, Chat header text).** The
  title in `subtitle` (17/24) over `monoSm` is 40 high against Figma's
  37 and the model chip 26 against 22; within the tolerance.
- **The stars sit elsewhere (Backdrop stars).** `Backdrop size="tablet"`
  draws the library's fixed star field, not T5's own stars.
- **No status bar.** The app draws no status bar (d-089), so the
  side-by-side shows a blank band at the top.
