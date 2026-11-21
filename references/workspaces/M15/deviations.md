# M15 deviations

What still differs from Figma M15 · New menu (the menu that + at the top
of the phone's list opens, `phoneAddMenu`), after the last fidelity run
(`pnpm fidelity workspaces M15`, 2026-11-18, library 1.0.0-beta.36), each
with its reason. The library gaps are in
`web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is M1's
`PhoneWorkspaceList` with `ui.addMenuOpen`: `PhoneAddMenu` opens
`Menu size="lg" width="phone" iconTone="default" placement="bottom-end"`
under + with New chat and New workspace, and + draws `border.active` while the menu is open, the
library default for a menu trigger.

## Checks

- Text: pass. Every Figma string is in the render and seen, and no text
  is extra; the 220 px menu leaves `bridge themes` (`208:351`) clear.
- Position: fail, 10 layers off by more than 4 px:
  - `208:515` (the menu): h +6.
  - `208:521` (New chat's icon): y -5.5.
  - `208:434` (hono server) and `208:448` (its ⋯): y -6.
  - `208:453` (dev server) and `208:464` (its ⋯): y -6.
  - `208:469` (OMNI header): y -6.
  - `208:479` (release notes) and `208:495` (its ⋯): y -8.
  - `208:500` (SKILL-EVALS header): y -8.
- Rules: pass.

## Deviations

- **No row is drawn selected (review R38).** Figma draws bridge themes
  with the selected fill and border. Erik (review R38, 2026-11-21): "On
  tablet and mobile this shouldn't stay highlighted (selected )". The
  phone and tablet list shows no chat beside it, so after a return from a
  chat the row kept a selected state that marked nothing. The list now
  passes no selected chat to `SidebarGroup`, so every row draws
  unselected; the desktop sidebar keeps the shown chat selected
  (`web/src/app/WorkspacesNoKeptSelect.test.tsx`). The fill has no
  `data-figma` and no text, so no check measures it.

- **The menu's rows are 2 px taller and the icons larger (Phone new
  menu), `208:521` y -5.5, `208:515` h +6.** The menu is 220 wide, as
  Figma's, with its end under +'s end (`Menu width="phone"`, library
  beta.36, #143), and its icons draw the labels' `fg.default`
  (`iconTone="default"`, #146). `Menu size="lg"` draws 44 px rows with
  20 px icons against Figma's 42 px rows 2 apart with 18 px icons; on
  the 4 px grid 42 and 18 take 44 and 20 (d-100), so the rows stay. The
  menu is 6 px taller and New chat's icon 5.5 px higher and 4 px right
  of Figma's (within the tolerance across); New workspace's icon is
  within 4 px. The labels are Regular 15, as Figma's.
- **Lower workspaces start higher (Sidebar group header), `208:434` to
  `208:500` y -6 to -8.** As in M01 and M14: `GroupHeader
  variant="sidebar"` is 30 high against Figma's 28 and its rows start
  right under it, where Figma leaves 4, so each workspace after the first
  starts 2 px higher.
- **The row ⋯ is lighter (Phone chat row).** As in M01, the 20 px thin
  `MoreIcon` in `fg.muted` against Figma's heavy 18 px dots, on every row
  and on each workspace header.
- **The nested row starts further left (Phone chat row).** As in M01:
  `ListRow level={1}` pads 24 where Figma pads 44, so theme tokens' ↳,
  mark and title sit 14 to 19 px left of Figma's.
- **Header (Phone page header).** As in M01, `PageHeader size="phone"`
  is 40 high against Figma's 44; the header pads 4 under it.
- **The stars sit elsewhere (Backdrop stars).** `Backdrop size="phone"`
  draws the Inbox phone frame's stars at fixed places, not M15's.
- **Status bar and home indicator.** The app draws none (d-089), so the
  side-by-side shows a blank band at the top.
- **What the actions do.** New chat opens New chat (M7) with the current
  workspace, omni-brain, chosen; New workspace adds a workspace named
  "new workspace" after the others and opens edit mode with its name as
  a field (M2), as the frame's note says.
