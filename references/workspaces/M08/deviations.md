# M08 deviations

What still differs from Figma M8 · Folders (D4's folders and folder picker
in a sheet over drift check on the phone, `phoneFolders`), after the last
fidelity run (`pnpm fidelity workspaces M08`, 2026-11-18, library
1.0.0-beta.30), each with its reason. The library gaps are in
`web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is M3's
`PhoneChat` with drift check, no ⋯ and the folders chip in place of the
context label; `PhoneFolders` (`BottomSheet` titled Folders with its
close button) holds D4's `FolderRows`, a rule, `FolderPickerList
size="sheet"` and Add ~/the-bridge as the direct child of a `ScrollFrame`
footer (so its focus ring is drawn inside it, whole), and the
search has the focus with its caret after "~/the-".

## Checks

- Text: pass. `exceptions.json` lists the composer's placeholder
  ("Message, or / for a skill"): the composer stays at the bottom of the
  chat (d-107) and the sheet covers it whole, but the text check counts a
  covered run as extra text. Figma leaves the composer out under its
  sheet.
- Position: fail, 3 of 17 layers pass: the header (`128:671`), the back
  button (`128:673`) and Erik's message (`128:701`). Fourteen fail:
  - `128:695` (the folders chip): w +4.9.
  - `128:716` (~/omni-brain): y +134.
  - `128:722` (~/omni): y +133.
  - `128:730` (Add folder): y +132.
  - `128:735` (the rule over the picker): y +130.
  - `128:736` (the picker's title row): y +130, h +6.
  - `128:747` (the search): y +136.
  - `128:754`, `128:760`, `128:766` (the recent folders): y +138, +137,
    +136.
  - `128:779`, `128:786`, `128:793` (the folders of ~/): y +136, +137,
    +138.
  - `128:802` (Add ~/the-bridge): y -16.
- Rules: pass.

## Deviations

- **The sheet is shorter and starts much lower (Phone folders sheet),
  `128:716` y +134, `128:722` y +133, `128:730` y +132, `128:735` y +130,
  `128:736` y +130, `128:747` y +136, `128:754` y +138, `128:760` y +137,
  `128:766` y +136, `128:779` y +136, `128:786` y +137, `128:793`
  y +138.** Figma's sheet is 786 high from y 58, with a 147 px empty space
  over Add. `BottomSheet` is as high as its content and no size token
  gives Figma's height, so the sheet starts at about y 208: the title row,
  the folders and the picker sit about 134 px lower, with no empty space
  over Add (library beta.30's `ScrollFrame` footer, #134, no longer pads
  4 above Add, so the sheet is 4 px shorter than with beta.28), and Erik's message and the header's second row show above the
  sheet, under the scrim.
- **The title row is taller (Phone folders sheet).** `BottomSheet`'s title
  row with its close button is 46 high against Figma's 22 row and its
  8 px gaps, and its × is 16 px in a 28 px button against Figma's 18 px.
- **Add ~/the-bridge sits 16 px higher (Phone folders sheet), `128:802`
  y -16.** `BottomSheet` keeps the 34 px safe area
  (`shell.safeAreaBottom`) under its content against Figma's 23, and
  `Button size="xl"` is 44 high against Figma's 40.
- **The folders chip is 5 px wider (Phone folders sheet), `128:695`
  w +4.9.** `Button size="xs"` pads and spaces the folder icon and
  "2 folders" so the chip is 88 × 24 against Figma's 83 × 22, and the icon
  is 12 px against 13.
- **The picker's title row is 6 px taller (Folder picker), `128:736`
  h +6.** Close is a 24 px button against Figma's 18 px ×; the title's
  folder icon is 16 px against 18, as in D04.
- **Search field (Folder picker).** `SearchField` draws "~/the-" in `body`
  (Geist 14) against Figma's Geist Mono and adds a clear × at the end,
  which Figma has not, as in D04. The focus trap selects the field's text
  when the sheet opens; the sheet puts the caret after the text, as Figma
  draws it.
- **No caret (Folder picker).** Figma draws the caret after "~/the-"
  (128:747). The field has the focus (its cyan border), but the fidelity
  screenshot shows no caret: the caret blinks, so a screenshot catches it
  off or hides it, as in M02 and D21.
- **Rows (Folder list, Folder picker).** The folder rows are 36 high
  (`Button size="lg"`) against 37, Add folder 28 against 30 (its border
  dashed, as Figma's 128:730), the recent rows 32 against 33 and
  35 (the chosen ~/the-bridge), the folders of ~/ 32 against 31; all
  within the tolerance. "working folder" is `fg.muted`, as in D04. The
  chosen ~/the-bridge draws `border.selected`, as Figma's 128:766
  (#5ee1ff at 0.5).
- **Chat header (Chat header, Chat header text).** As in M03: the title is
  `subtitle` (17/24) against Figma's SemiBold 16 and the model chip 26
  high against 22; Figma's header here has no ⋯ and no "context" label,
  and the build leaves both out.
- **No status bar or home indicator.** The app draws no status bar
  (d-089), so the side-by-side shows a blank band at the top.
- **What the sheet does not do yet.** Add ~/the-bridge, a folder's × and
  the folders of ~/ do nothing; a recent folder can be chosen, the
  picker's × closes the picker and Add folder opens it again, and the
  sheet's ×, the scrim and Escape close the sheet, which the chip opens
  again.

## Second row under the kind mark (d-121)

The owner chose the chat header's option E (decision d-121, 2026-11-23): the
second row starts at the left edge of the kind mark, not at the back
button's. The whole row moves 28 px right, with the folders chip (128:695)
in it, so the position check finds that chip 30.8 px from Figma's x. The
header's height and the first row do not change. It is a frame exception
that the owner's decision sets (`blocks/ChatHead.tsx`,
`app/WorkspacesChatHeadRows.test.tsx`).
