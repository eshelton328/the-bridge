# M09 deviations

What still differs from Figma M9 · Long-press a chat (drift check held in
the phone's list, `phoneHoldChat`), after the last fidelity run
(`pnpm fidelity workspaces`, 2026-11-18, library 1.0.0-beta.27), each
with its reason. The library gaps are in
`web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is M1's
`PhoneWorkspaceList` with `ui.menuFor` on drift check: its row's copy lifts
over the scrim in `DragPreview`, and `PhoneChatActions` opens with no
trigger, titled drift check, with `data.phone.rowMenu` (Rename first,
highlighted from `ui.menuHighlight`) and Move to workspace closed.

## Checks

- Text: pass, with four exceptions (`exceptions.json`): the lifted copy's
  "drift check", "GPT-5.5", "23%" and "Needs you" (146:258, 146:260,
  146:264, 146:267). The library draws the copy (BottomSheet `lifted`)
  with no pointer events, so the check's hit test skips it and reads its
  strings as covered; `WorkspacesPhoneHoldChat.test.tsx` finds the copy on
  top at its centre. The row under the copy is hidden while the sheet is
  open, where Figma draws the copy (146:252) over it (146:117).
- Position: fail, 24 of 38 layers pass: the list (`146:67`), the header
  (`146:68`), Edit (`146:73`), + (`146:75`), omni-brain's header and rows
  with their ⋯, the lifted copy (`146:252`) and its ⋯ (`146:268`), the-bridge's
  header (`146:154`), the tab bar and its five tabs, and the Folders and
  Move to workspace icons (`146:323`, `146:330`). Fourteen fail:
  - `146:165` (hono server) and `146:179` (its ⋯): y -6.
  - `146:184` (dev server) and `146:195` (its ⋯): y -6.
  - `146:200` (omni's header): y -6.
  - `146:210` (release notes) and `146:226` (its ⋯): y -8.
  - `146:231` (skill-evals' header): y -8.
  - `146:375` (Rename's icon): y +34.
  - `146:286` (Fork's icon): y +28.
  - `146:297` (Side chat's icon): y +22.
  - `146:304` (Subtask's icon): y +16.
  - `146:311` (Subagents' icon): y +10.
  - `146:381` (Close chat's icon): y -8.
- Rules: pass.

## Deviations

- **Lower workspaces start higher (Sidebar group header), `146:165` to
  `146:231` y -6 to -8.** As in M01: `GroupHeader variant="sidebar"` is
  30 high against Figma's 28 and its rows start right under it, where
  Figma leaves 4, so each workspace after the first starts 2 px higher.
  These rows sit under the scrim, and the lower ones under the sheet.
- **The sheet starts lower and its action rows are 6 px closer together
  (Phone chat actions sheet), `146:375` y +34 to `146:381` y -8.** As in
  M04: `OptionList` rows are 38 high, edge to edge, against Figma's 42 px
  rows 2 apart, and `BottomSheet` is as high as its content, where
  Figma's sheet is 413 high from y 431. So Rename's row is 34 px lower
  than Figma's and each row after it comes 6 px closer, until Close chat
  is 8 px higher. The icons are 20 and 16 px against Figma's 18 and 14,
  2 px further in.
- **The action labels are smaller and Medium, and the title sits lower
  and further in (Phone chat actions sheet).** Figma draws the labels in
  Regular 15 and the title 2 under the grabber at x 13; `OptionList`
  draws `label` (Medium 14) and `BottomSheet size="sm"` puts the title
  12 under the grabber and 17 in.
- **Close chat's label is white (Phone chat actions sheet).** Figma draws
  it red; `OptionList` has no tone, so only the × is red.
- **The row ⋯ is lighter (Phone chat row).** As in M01, the 20 px thin
  `MoreIcon` in `fg.muted` against Figma's heavy 18 px dots, on every row
  and on the lifted copy.
- **The nested row starts 14 to 19 px further left (Phone chat row).**
  As in M01, Figma's theme tokens
  row (199:28) pads 44 at the start and puts its
  parts 8 apart: the ↳ at x 56, the kind mark at 77 and the title at
  101. `ListRow level={1}` pads 24 inside its 1 px border and puts its
  parts 10 apart, so the render draws them at 37, 61 and 87. No spacing
  token is 44, and `ListRow` takes no class and draws the ↳ before
  `leading`, so the page cannot move it. These parts carry no
  `data-figma`, so the position check does not measure them.
- **Header (Phone page header).** As in M01, `PageHeader size="phone"`
  is 40 high against Figma's 44; the header pads 4 under it.
- **The hold is the page's own (Long press).** The library has no
  hold. `HoldArea` opens the actions after 500 ms of a still finger (a
  move past 8 px cancels it, and the click that ends a hold does not open
  the chat) and turns off text selection and the callout. The copy is the
  library's: `PhoneChatActions` passes the sheet `lifted`, with the row as
  the anchor and `LiftedChatRow` (`DragPreview`: cyan border,
  `surface.overlay`, `lift` shadow, 6 above the row) as the content, and
  the sheet draws it over its scrim (library 1.0.0-beta.93).
- **No home indicator.** The app draws no status bar or home indicator
  (d-089), so the side-by-side shows a blank band at the top.
- **Actions still to build.** Move to workspace opens and closes its
  list; Rename, Fork, Side chat, Subtask, Subagents, Folders and Close
  chat close the sheet only. The row's ⋯ opens the same sheet.
