# T12 deviations

What still differs from Figma T12 · Move to workspace (T2b's chat on the
iPad mini, with the chat actions menu open under the ⋯ and Move to
workspace's list open beside it, `tabletMoveToWorkspace`), after the last
fidelity run (`pnpm fidelity workspaces`, 2026-11-18, library
1.0.0-beta.42), each with its reason. The library gaps are in
`web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is T02b's
`PhoneChat` at the tablet's width (`device="tablet"`, with `tabletList`):
the ⋯ is the trigger of D2b's `ChatActionsMenu` (`PaneMenu`, `Menu
width="sm" density="compact"`, `placement="bottom-end"`), Move to
workspace is highlighted (`ui.menuHighlight`) and its list is open
(`ui.moveOpen`) with the-bridge highlighted (`ui.moveTarget`), as on D19.
The library opens the list on the menu's left, as Figma draws it, as the
screen has no room on the right. The chat has no tab bar, so the render
has no Artifacts tab, and no exception is needed.

## Checks

- Text: pass. Every Figma string is in the render and visible, the
  list's `the-bridge`, `omni`, `skill-evals` and `New workspace…`
  included. The end of Claude's reply that the menu covers is covered in
  Figma too.
- Position: fail, 6 of 7 layers pass: the header (`420:1197`), the back
  button (`420:1199`), the ⋯ (`420:1210`), Erik's message (`420:1226`),
  the menu (`420:1266`) and the composer (`420:1243`). One fails:
  - `420:1231` (Claude's reply with Copy): h +8.
- Rules: pass.

## Deviations

- **The composer ends 1 px higher (Tablet safe area, closed by
  beta.42).** `AppShell size="tablet"` keeps 34 (`shell.safeAreaBottom`)
  under the detail with no tab bar, so the composer ends 34 over the
  screen's end, at y 1124, against Figma's 33 (y 1125 of 1158): y -4,
  h +3, within the tolerance, as on T07. The composer is
  78 high against Figma's 75 (Composer text).
- **Claude's reply is taller (Message text), `420:1231` h +8.** `Message`
  draws the text in `body` (14/20) and the name in `label` against
  Figma's Geist 13 on a 19 px line and SemiBold 12, and Copy is 24 high
  against 22; the reply wraps at another word, under the menu.
- **Move to workspace's list sits lower (Submenu offset, Submenu data
  attributes).** Figma puts the list's top 7 px above Move to workspace,
  so the-bridge lines up with that row; `MenuSubmenu` places the list
  itself and takes no offset, so it shows about 12 px lower, as on D19.
  It opens on the menu's left, 200 wide, as in Figma. Its box takes no
  `data-figma`, so the position check does not measure `420:1325`.
- **The open ⋯ has a cyan box (Bare menu trigger).** Figma draws T12's
  ⋯ bare while its menu is open, as T2b does. The render follows the
  open trigger rule: a trigger that opens a menu, popover or sheet draws
  `border.active` while open (the library's default), so the bare ⋯
  shows a 24 px cyan box round its icon, as on T02b.
- **The ⋯ is lighter (Chat header).** As on T02b: a thin 20 px
  `MoreIcon` against Figma's heavy 18 px icon; the icon set has no 18 px
  size.
- **The menu's and the list's icons are 16 px and lighter (Menu icon
  size).** Figma's icons are 14 px; the icon sizes are 12, 16, 20 and
  24. Subagents' icon is `fg.accent`, and the highlighted Move to
  workspace's and the-bridge's icons are the accent colour, as Figma
  draws them; the other workspaces' grid icons are `fg.muted`, where
  Figma draws them in the text colour.
- **The menu's labels are larger (Menu icon size).** Figma draws them in
  Geist Regular 13, `bodySm`; `Menu` draws `label` (Medium 14) and takes
  no label size, so each label is about 1 px larger and heavier.
- **The header is 2 px taller (Chat header, Chat header text).** The
  title in `subtitle` (17/24) over `monoSm` is 40 high against Figma's
  37 and the model chip 26 against 22; within the tolerance.
- **The composer's border is grey.** Figma draws the composer with a cyan
  border while the menu is open; the focus is in the menu, and the
  library's `Composer` draws `border.default` when its box has no focus.
  The composer's text is larger than Figma's 13 px (Composer text).
- **The transcript sits 24 in from the sides, Figma's 22,** on the 4 px
  grid; within the tolerance.
- **The stars sit elsewhere (Backdrop stars).** `Backdrop size="tablet"`
  draws the library's fixed star field, not T12's own stars.
- **No status bar.** The app draws no status bar (d-089), so the
  side-by-side shows a blank band at the top.
- **Square screen corners (device chrome).** Figma draws the iPad's
  screen with rounded corners; the app draws no device chrome (d-089).
- **Thin icons (Icon stroke weight).** Figma draws the back chevron, the
  model chips' chevrons, the composer's paperclip and the stop mark with
  a 2 px stroke at their own size; the icon set draws a 2 px stroke in a
  24 px box, so at 12 to 20 px they look thinner and lighter.
- **The model chip's chevron is grey (Model chip chevron).** Figma draws
  it in the text colour; `ModelChip` draws its own chevron in a muted
  grey and takes no tone.
- **Erik's message is larger (Message text).** Figma draws it in Geist
  13 on a 19 px line; `Message from="user"` draws `body` (14/20).
- **Menu surface (2026-11-18).** Library beta.45 gives the `Menu`
  content the `blurs.glass` backdrop blur, as Figma's chat actions menu
  (420:1266) has, so Claude's reply under the menu no longer shows through it.
- **No exceptions.**
