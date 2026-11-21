# M01 deviations

What still differs from Figma M1 · Workspaces (the phone's home,
`phoneHome`), after the last fidelity run (`pnpm fidelity workspaces`,
2026-11-18, library 1.0.0-beta.27), each with its reason. The library gaps
are in `web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is the first
phone frame of the page: at a phone's width a state with `data.phone`
draws `WorkspacesPhone` (the list, with the shared tab bar laid over
its foot); D01 to D21 render as before (the same run gives each the same report as on main).

## Checks

- Text: pass. Every Figma string shows, `SKILL-EVALS` and its `1` above
  the tab bar included; no extra text.
- Position: 20 of 28 layers pass. The list (`105:2327`), the header
  (`105:2328`), Edit (`105:2333`), + (`105:2335`), omni-brain's header
  and rows with their ⋯, the-bridge's header, the tab bar (`tab bar`)
  and its five tabs (`tab · Home`, `tab · Inbox`, `tab · Workspaces`,
  `tab · Projects`, `tab · More`) pass. `105:2405`, `146:17`, `105:2419`, `146:22`, `105:2430`,
  `105:2440`, `146:27` and `105:2456` fail.
- Rules: pass.

## Failing layers

Render minus Figma, in px. All three checks render the page 38 px
shorter, below Figma's status bar (d-102), and the position check adds
38 to each render y (d-101).

- `105:2405` (hono server) and `146:17` (its ⋯): y -6.
- `105:2419` (dev server) and `146:22` (its ⋯): y -6.
- `105:2430` (omni's header): y -6.
- `105:2440` (release notes) and `146:27` (its ⋯): y -8.
- `105:2456` (skill-evals' header): y -8.

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

- **Lower workspaces start higher (Sidebar group header).** The phone
  lists the workspaces with the desktop sidebar's `SidebarGroup`. Its
  `GroupHeader variant="sidebar"` is 30 high against Figma's 28, and its
  rows start right under it, where Figma leaves 4. Each workspace after
  the first so starts 2 px higher than the one above: the-bridge's header
  passes, its rows are 6 px higher (`105:2405`, `146:17`, `105:2419`,
  `146:22`), omni's header 6 (`105:2430`) and its row and skill-evals'
  header 8 (`105:2440`, `146:27`, `105:2456`). Each row is 52 high, as
  Figma's.
- **The nested row starts 14 to 19 px further left (Phone chat row).**
  Figma's theme tokens row (199:5) pads 44 at the start and puts its
  parts 8 apart: the ↳ at x 56, the kind mark at 77 and the title at
  101. `ListRow level={1}` pads 24 inside its 1 px border and puts its
  parts 10 apart, so the render draws them at 37, 61 and 87. No spacing
  token is 44, and `ListRow` takes no class and draws the ↳ before
  `leading`, so the page cannot move it. These parts carry no
  `data-figma`, so the position check does not measure them.
- **Group header icons (Sidebar group header).** The chevrons are the
  library's 12 px `ChevronDownIcon` and `ChevronRightIcon`, and the ⋯ at
  the header's end is a 12 px `MoreIcon` in a 24 px button, against
  Figma's 13 and 14 px icons; they look thinner and smaller.
- **Row ⋯ (Phone chat row).** Figma's ⋯ (146:2) is 36 × 36 with heavy
  18 px dots, 8 after the status and 2 in from the row's end. The render's
  is a 36 px text button with the 20 px `MoreIcon`, whose dots are
  thinner and darker (`fg.muted`), as the icon set has no 18 px size or
  stroke weight. `ListRow` has no slot beside its trailing column and pads
  10 inside its border, so the button reaches 8 into the row's end
  padding and 4 into its top and bottom padding; the ⋯ and the pills sit
  close to where Figma has them (the ⋯ within
  the tolerance; the pills are not measured).
- **Header (Phone page header).** `PageHeader size="phone"` is 40 high
  against Figma's 44, so the header pads 4 under it. Edit and + are
  `Button size="sm"`, 28 high against Edit's 30 (Edit sits 3 px lower,
  within the tolerance), and + is 36 wide, as in Figma, because it is not
  an `iconOnly` button.
- **The stars sit elsewhere (Backdrop stars).** Figma draws the frame's
  own 22 stars behind the screen (the 22 `star` layers that `frame.json`
  skips); `Backdrop size="phone"` draws the Inbox phone frame's 22 stars
  (346:8982) at fixed places and takes no positions, so the render's
  dots have Figma's count and tone but sit in other places.
- **Status bar and home indicator.** Figma draws a 38 px status bar
  (9:41), the home indicator and the frame's rounded corners; the app
  draws none (d-089), so the side-by-side shows a blank band at the top.
- **Buttons with no action yet.** Edit (M2), + (M15), each row's ⋯ (M9)
  and each workspace's ⋯ (M14) open frames still to build; in M1 they
  draw only. A tap on a row selects it (`ui.focusedPane`, the cyan row);
  opening its chat is M3. A workspace's chevron shows or hides its chats,
  the tab bar's More opens the More drawer,
  and the page entry goes to Inbox, Artifacts or Toolkit when one is
  picked (Projects has no route yet).
- **No exceptions.** The rail exceptions of D01 to D21 do not apply: the
  phone has no rail, and the tab bar shows Home, Inbox, Workspaces,
  Projects and More, as Figma does.
