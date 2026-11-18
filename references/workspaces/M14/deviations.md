# M14 deviations

What still differs from Figma M14 · Workspace actions (the sheet that the
⋯ of omni-brain's header opens over the phone's list,
`phoneWorkspaceActions`), after the last fidelity run (`pnpm fidelity
workspaces M14`, 2026-11-18, library 1.0.0-beta.30), each with its
reason. The library gaps are in `web/src/pages/workspaces/LIBRARY_GAPS.md`.
The screen is M1's `PhoneWorkspaceList` with `ui.workspaceMenuFor` on
omni-brain: `PhoneChatActions` opens with no trigger, titled omni-brain,
with `data.phone.workspaceMenu` (New chat in omni-brain, Rename
workspace, Close workspace), none highlighted.

## Checks

- Text: pass. Every Figma string shows, the sheet's title and its three
  actions included; no extra text.
- Position: fail, 9 layers off by more than 4 px:
  - `208:135` (hono server) and `208:149` (its ⋯): y -6.
  - `208:154` (dev server) and `208:165` (its ⋯): y -6.
  - `208:170` (OMNI header): y -6.
  - `208:180` (release notes) and `208:196` (its ⋯): y -8.
  - `208:201` (SKILL-EVALS header): y -8.
  - `208:290` (Close workspace's icon): y -8.
- Rules: pass.

## Deviations

- **Lower workspaces start higher (Sidebar group header), `208:135` to
  `208:201` y -6 to -8.** As in M01 and M09: `GroupHeader
  variant="sidebar"` is 30 high against Figma's 28 and its rows start
  right under it, where Figma leaves 4, so each workspace after the first
  starts 2 px higher. These rows sit under the scrim.
- **The action rows are 6 px closer together (Phone chat actions sheet),
  `208:290` y -8.** As in M04 and M09: `OptionList` rows are 38 high,
  edge to edge, against Figma's 42 px rows 2 apart. New chat in
  omni-brain's row sits 4 px lower than Figma's, Rename workspace's
  about where Figma has it, and Close workspace's 8 px higher, so the
  sheet shows more empty room under its last row. The icons are 20 px
  against Figma's 18, 2 px further in.
- **The sheet's top and grabber are 10 px higher (Phone chat actions
  sheet).** Figma's sheet (208:235) starts at y 651 with its grabber 9
  down and the title 2 under the grabber (y 667). The render's title is
  at 667 too, but `BottomSheet size="sm"` puts the title 12 under the
  grabber, so the sheet starts at 641 and its grabber is at 650; the
  sheet is 203 high against 193. `BottomSheet` takes no padding prop or
  `className`.
- **Rename workspace's icon has no line (Edit icon with a line).**
  Figma's icon (208:240) is a pencil over a baseline; `EditIcon` is the
  pencil alone, and the icon set has no edit icon with the line.
- **The action labels are smaller and Medium, and the title sits further
  in (Phone chat actions sheet).** Figma draws the labels in Regular 15
  and the title at x 13; `OptionList` draws `label` (Medium 14) and
  `BottomSheet size="sm"` puts the title 17 in.
- **Close workspace's label is white (Phone chat actions sheet).** Figma
  draws it red; `OptionList` has no tone, so only the × is red.
- **The row ⋯ is lighter (Phone chat row).** As in M01, the 20 px thin
  `MoreIcon` in `fg.muted` against Figma's heavy 18 px dots, on every row
  and on each workspace header.
- **The nested row starts further left (Phone chat row).** As in M01:
  `ListRow level={1}` pads 24 where Figma pads 44, so theme tokens' ↳,
  mark and title sit 14 to 19 px left of Figma's.
- **Header (Phone page header).** As in M01, `PageHeader size="phone"`
  is 40 high against Figma's 44; the header pads 4 under it.
- **The stars sit elsewhere (Backdrop stars).** `Backdrop size="phone"`
  draws the Inbox phone frame's stars at fixed places, not M14's.
- **Status bar and home indicator.** The app draws none (d-089), so the
  side-by-side shows a blank band at the top.
- **The header's ⋯ is not measured.** Figma's layer is the 14 px icon
  (`208:44`); the render's ⋯ is a 24 px `Button size="xs"` around a 12 px
  icon, so it carries no `data-figma`.
- **What the actions do.** New chat in omni-brain opens New chat when the
  state has its form (M14's has none, so it closes the sheet only);
  Rename workspace starts edit mode with the workspace's name as a field
  (M2); Close workspace opens M13's dialog.
