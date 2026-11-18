# M01 deviations

What still differs from Figma M1 · Workspaces (the phone's home,
`phoneHome`), after the last fidelity run (`pnpm fidelity workspaces`,
2026-11-17, library 1.0.0-beta.20), each with its reason. The library gaps
are in `web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is the first
phone frame of the page: at a phone's width a state with `data.phone`
draws `WorkspacesPhone` (the list over the shared tab bar); D01 to D21
render as before (the same run gives each the same report as on main).

## Checks

- Text: pass. Every Figma string shows, `SKILL-EVALS` and its `1` above
  the tab bar included; no extra text.
- Position: 15 of 23 layers pass. The list (`105:2327`), the header
  (`105:2328`), Edit (`105:2333`), + (`105:2335`), omni-brain's header
  and rows with their ⋯, the-bridge's header and the tab bar (`tab bar`)
  pass. `105:2405`, `146:17`, `105:2419`, `146:22`, `105:2430`,
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

- **Lower workspaces start higher (Sidebar group header).** The phone
  lists the workspaces with the desktop sidebar's `SidebarGroup`. Its
  `GroupHeader variant="sidebar"` is 30 high against Figma's 28, and its
  rows start right under it, where Figma leaves 4. Each workspace after
  the first so starts 2 px higher than the one above: the-bridge's header
  passes, its rows are 6 px higher (`105:2405`, `146:17`, `105:2419`,
  `146:22`), omni's header 6 (`105:2430`) and its row and skill-evals'
  header 8 (`105:2440`, `146:27`, `105:2456`). Each row is 52 high, as
  Figma's.
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
