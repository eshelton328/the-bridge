# M15 deviations

What still differs from Figma M15 · New menu (the menu that + at the top
of the phone's list opens, `phoneAddMenu`), after the last fidelity run
(`pnpm fidelity workspaces M15`, 2026-11-18, library 1.0.0-beta.30), each
with its reason. The library gaps are in
`web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is M1's
`PhoneWorkspaceList` with `ui.addMenuOpen`: `PhoneAddMenu` opens
`Menu size="lg" placement="bottom-end"` under + with New chat and New
workspace, and + draws `border.active` while the menu is open, the
library default for a menu trigger.

## Checks

- Text: fail. Every Figma string is in the render and no text is extra,
  but `bridge themes` (`208:351`) is not visible: it is `covered` by the
  menu, whose box is 20 px wider than Figma's (below).
- Position: fail, 11 layers off by more than 4 px:
  - `208:515` (the menu): x -20, w +20, h +6.
  - `208:521` (New chat's icon): x -16, y -5.5.
  - `208:529` (New workspace's icon): x -16.
  - `208:434` (hono server) and `208:448` (its ⋯): y -6.
  - `208:453` (dev server) and `208:464` (its ⋯): y -6.
  - `208:469` (OMNI header): y -6.
  - `208:479` (release notes) and `208:495` (its ⋯): y -8.
  - `208:500` (SKILL-EVALS header): y -8.
- Rules: pass.

## Deviations

- **The menu is 20 px wider and starts further left, over the end of
  bridge themes' name (Phone new menu), `208:515` x -20 w +20, text
  `bridge themes` covered.** Figma's menu is 220 wide; `Menu`'s box is at
  least 240 (`width` `sm` 240, `sort` 280, `md` 320) and no size token is
  220. The menu keeps its end under +'s end, as Figma does, so its start
  is 20 px further left and covers "themes" in bridge themes' name, which
  Figma leaves clear. The render is wrong, so no exception covers it.
- **The menu's rows are 2 px taller and the icons larger (Phone new
  menu), `208:521` x -16 y -5.5, `208:529` x -16, `208:515` h +6.**
  `Menu size="lg"` draws 44 px rows with 20 px icons against Figma's
  42 px rows 2 apart with 18 px icons. The labels are Regular 15, as
  Figma's. The icons sit 16 px left of Figma's because the box starts
  20 px further left.
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
