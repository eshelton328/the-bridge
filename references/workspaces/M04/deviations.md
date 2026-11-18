# M04 deviations

What still differs from Figma M4 · Chat actions (bridge themes' actions in
a sheet on the phone, `phoneChatActions`), after the last fidelity run
(`pnpm fidelity workspaces M04`, 2026-11-17, library 1.0.0-beta.25), each
with its reason. The library gaps are in
`web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is M3's
`PhoneChat` with `ui.menuFor` set: its ⋯ is the trigger of
`PhoneChatActions` (`BottomSheet size="sm"` titled with the chat's name,
the actions in `OptionList`s), with Move to workspace open on the-bridge.

## Checks

- Text: pass. Every Figma string shows, the title and the four workspace
  rows included. `exceptions.json` lists the composer's placeholder
  ("Message, or / for a skill") and "Stop": the composer stays at the
  bottom of the chat (d-107) and the sheet covers it whole, but the text
  check counts a covered run as extra text. Figma leaves the composer out
  under its sheet.
- Position: fail, 5 of 17 layers pass: the header (`105:2878`), the back
  button (`105:2880`), the ⋯ (`105:2891`), Erik's message (`105:2907`) and
  Rename's icon (`105:3020`). Twelve fail:
  - `105:2912` (Claude's reply): h +9.
  - `105:2938` (Fork's icon): y +40.
  - `105:2949` (Side chat's icon): y +34.
  - `105:2956` (Subtask's icon): y +28.
  - `105:2963` (Subagents' icon): y +22.
  - `136:68` (Folders' icon): y +16.
  - `105:2975` (Move to workspace's icon): y +10.
  - `105:2988` (the-bridge's icon): y +6.
  - `105:2998` (omni's icon): y +6.
  - `105:3006` (skill-evals' icon): y +6.
  - `105:3014` (New workspace…'s icon): y +6.
  - `105:3026` (Close chat's icon): y -8.
- Rules: pass.

## Deviations

- **The sheet starts lower and its action rows are 6 px closer
  together (Phone chat actions sheet), `105:2938` y +40 to `105:3026`
  y -8.** Figma's action rows are 42 high, 2 apart (a 44 px pitch);
  `OptionList` rows are 38 high, edge to edge, and `BottomSheet` is as
  high as its content, where Figma's sheet is 555 high from y 289. So the
  sheet starts lower, Fork's row is 40 px lower than Figma's, and
  each row after it comes 6 px closer, until Close chat is 8 px higher.
  The workspace rows under Move to workspace keep Figma's 34 px pitch,
  6 px lower. The icons are 20 and 16 px against Figma's 18 and 14 (the
  icon set has no 18 or 14 px size), and they sit 2 px further in.
- **The action labels are smaller and Medium (Phone chat actions
  sheet).** Figma draws them in Regular 15 and the workspaces in Regular
  13; `OptionList` draws `label` (Medium 14) and, at `size="sm"`,
  `labelSm` (Medium 13).
- **Close chat's label and the-bridge's label are white (Phone chat
  actions sheet).** Figma draws Close chat in red and the highlighted
  workspace in the accent colour. `OptionList` has no tone and keeps the
  chosen row's label in `fg.default`; the icons carry the colours (Close
  chat's × red, the-bridge's grid cyan, the other workspaces' icons grey).
- **Claude's reply is 9 px taller (Message text), `105:2912` h +9.** As in
  M03: `Message` draws the reply in `body` (14/20) and the name in `label`,
  against Figma's Geist 13 on a 19 px line, so the reply wraps to three
  lines and "sessions on the desktop." shows above the sheet, which also
  starts lower.
- **The ⋯ is lighter (Chat header).** As in M03, a 20 px thin `MoreIcon`
  against Figma's heavy 18 px icon. It stays bare while the sheet is open.
- **No home indicator.** Figma's sheet runs to the screen's end with the
  home indicator over it; the app draws no status bar or home indicator
  (d-089), so the side-by-side shows a blank band at the top.
- **Actions still to build.** Move to workspace opens and closes its list,
  and a workspace pick moves its check; it does not move the chat yet. Fork,
  Side chat, Subtask, Subagents, Folders, Rename and Close chat close the
  sheet only; their phone views are M05 and later.
