# T02b deviations

What still differs from Figma T2b · Chat actions menu (T2's chat on the
iPad mini, with the ⋯ beside its state open and D2b's chat actions under
it as a menu, `tabletChatActions`), after the last fidelity run (`pnpm
fidelity workspaces`, 2026-11-18, library 1.0.0-beta.39), each with its
reason. The library gaps are in `web/src/pages/workspaces/LIBRARY_GAPS.md`.
The screen is M3's `PhoneChat` at the tablet's width (`device="tablet"`,
with `tabletList`), with `ui.menuFor` set: at a tablet's width the ⋯ is
the trigger of D2b's `ChatActionsMenu` (`PaneMenu`, `Menu width="sm"
density="compact"`, `placement="bottom-end"`) in place of M4's sheet, and
Move to workspace is highlighted (`ui.menuHighlight`). The chat has no
tab bar, so the render has no Artifacts tab, and no exception is needed.

## Checks

- Text: pass. Every Figma string is in the render and visible. The end of
  Claude's reply that the menu covers is covered in Figma too.
- Position: fail, 5 of 7 layers pass: the header (`402:5635`), the back
  button (`402:5637`), the ⋯ (`402:5648`), Erik's message (`402:5664`)
  and the menu (`402:5721`). Two fail:
  - `402:5669` (Claude's reply with Copy): h +8.
  - `402:5783` (the composer): y +34, h +3.
- Rules: pass.

## Deviations

- **The composer sits at the screen's end (Tablet safe area),
  `402:5783` y +34.** Figma ends the composer 37 over the screen's end
  (the 21 px home indicator area and 16 above it). `AppShell
  size="tablet"` keeps no safe area under the detail when there is no
  tab bar, and the spacing tokens have no 36, so the composer ends at
  the screen's end. The composer is also 78 high against Figma's 75
  (Composer text).
- **Claude's reply is taller (Message text), `402:5669` h +8.** `Message`
  draws the text in `body` (14/20) and the name in `label` against
  Figma's Geist 13 on a 19 px line and SemiBold 12, and Copy is 24 high
  against 22; the reply wraps at another word, under the menu.
- **The open ⋯ has a cyan box (Bare menu trigger).** Figma draws T2b's ⋯
  bare while its menu is open, as T12 does; D02b draws it in a cyan box
  and D19 in a grey one. The render follows the open trigger rule: a
  trigger that opens a menu, popover or sheet draws `border.active` while
  open (the library's default), so the bare ⋯ shows a 24 px cyan box
  round its icon. T2b's bare ⋯ is recorded, not followed, because the
  rule settles the mix of open triggers across the Figma frames.
- **The ⋯ is lighter (Chat header).** As on T02: a thin 20 px `MoreIcon`
  against Figma's heavy 18 px icon; the icon set has no 18 px size.
- **The menu's icons are 16 px and lighter (Menu icon size).** Figma's
  menu icons are 14 px; the icon sizes are 12, 16, 20 and 24. The menu is
  240 wide and opens under the ⋯ at its right edge, within 1 px of
  Figma's box. Subagents' icon is `fg.accent` and the highlighted Move to
  workspace's icon is the accent colour, as Figma draws them.
- **The header is 2 px taller (Chat header, Chat header text).** The
  title in `subtitle` (17/24) over `monoSm` is 40 high against Figma's
  37 and the model chip 26 against 22; within the tolerance.
- **The composer's border is grey.** Figma draws the composer with a cyan
  border while the menu is open; the focus is in the menu, and the
  library's `Composer` draws `border.default` when its box has no focus.
  The composer's text and Stop are larger than Figma's 13 and 11 px
  (Composer text).
- **The transcript sits 24 in from the sides, Figma's 22,** on the 4 px
  grid; within the tolerance.
- **The stars sit elsewhere (Backdrop stars).** `Backdrop size="tablet"`
  draws the library's fixed star field, not T2b's own stars.
- **No status bar.** The app draws no status bar (d-089), so the
  side-by-side shows a blank band at the top.
