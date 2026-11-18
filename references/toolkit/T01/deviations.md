# T01 deviations

What still differs from Figma after round 1 of the fidelity loop
(`pnpm fidelity toolkit T01`, 2026-11-17, against the installed library
1.0.0-beta.8), each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/toolkitListTablet.ts`: the D1 list plus the
Rules group, with writing-reviewer at →3 as T1 shows it. The numbers
below are from the run with library 1.0.0-beta.15 and the props that
library #115 added: `ViewSwitch tone="accent"` and
`FilterChips padding="none"`.

## Checks

- Text: fail. Every Figma string is in the render. Thirteen strings of
  the Rules rows are not visible, because the taller rows push those rows
  under the tab bar (see Row height): `rules/commits-and-prs.md`,
  `rules/diagrams.md`, `linear`, `rules/linear.md`, `→0 ←0` (428:251),
  `readmes`, `rules/readmes.md`, `→1 ←4`, `releases`,
  `rules/releases.md`, `skills`, `rules/skills.md` and `→1 ←0`. The
  ste100 and writing names and counts (428:288, 428:291, 428:298,
  428:301) lie under Figma's tab bar too; `exceptions.json` names them.
  Since the tab bar lies over the page (AppShell `tabBarOverlay`,
  library 1.0.0-beta.26), the list runs under the bar as Figma's does,
  and `→0 ←0` (428:271) passes.
- Position: 13 of 38 layers pass (`header`, `read-only`,
  `view · List, Map or Activity`, `filter · chips`, `search`,
  `group · SKILLS`, `tab bar`).
  The shared navigation's items pass too: `tab · Home`, `tab · Inbox`,
  `tab · Workspaces`, `tab · Projects`, `tab · Artifacts` and
  `tab · More`.
- Rules: pass. The `hiddenOverflow` finding on the scrolling detail
  (`main.app-shell__detail`) is in `exceptions.json`: Figma's list runs
  on under the pinned tab bar, as the render's does.

## Deviations

- **Row height.** Each item is 72 px high against Figma's 59 (`h +13` on
  every row key). Figma's row has an 11 px inset; the library `Card` has
  16 (gap: Toolkit row (tablet)). The first row starts 3 px lower
  (within the tolerance). Each row of the grid after it starts 13 px
  lower than the one before, and each group header 3 px lower again:
  `toolkit row · audit-slop` and `toolkit row · eval-cases` y +16;
  `toolkit row · mermaid-diagrams` and `toolkit row · pr-description`
  y +29; `toolkit row · project-setup` and `toolkit row · readme` y +42;
  `group · AGENTS` y +68; `toolkit row · diagram-reviewer` and
  `toolkit row · eval-case-writer` y +71; `toolkit row · eval-grader` and
  `toolkit row · pr-description-checker` y +84;
  `toolkit row · readme-cold-reader` y +97;
  `toolkit row · writing-reviewer` y +110; `group · RULES` y +123;
  `toolkit row · commits-and-prs` and `toolkit row · diagrams` y +126;
  `toolkit row · linear` and `toolkit row · readmes` y +139;
  `toolkit row · releases` and `toolkit row · skills` y +152;
  `toolkit row · ste100` and `toolkit row · writing` y +165. Only the
  commits-and-prs and diagrams names show above the tab bar; Figma shows
  three rows of Rules there.
- **Counts place.** The counts (`→0 ←1`) follow the name in the row's
  first line; Figma puts them at the row's right end, centred on the
  row. `Card` puts its `badge` after the title (gap: Toolkit row
  (tablet)).
- **Kind tile.** The row's kind tile is 28 px (`KindTile size="sm"`)
  against Figma's 30 (gap: Kind tile 30 px).
- **Toolkit box.** Figma's `toolkit` layer (428:2) is the list's content
  box, 712 wide from x 22, and it ends at the tab bar (h 1040). The
  render's `toolkit` is the scrolling list with its 24 px sides, 756 wide
  from x 0, and as high as all its rows (`toolkit` x -22, y -12, w +44,
  h +302). The side is 24 px against Figma's 22: no space token has 22.
- **View switch.** List, Map and Activity and the Read-only badge
  before them pass the position check, and with `tone="accent"` the
  selected List item has the selected fill with no border, as in Figma.
  The switch is still 36 px high against Figma's 38, with a 2 px inset
  against 4 and 16 px icons against 15: no control token has 38 (gap:
  View switch 38 px).
- **Group headers.** SKILLS, AGENTS and RULES are 30 px high against
  Figma's 27 (`GroupHeader variant="sidebar"`; gap: Toolkit group
  header).
- **Workflows and Hooks.** The frame shows only the Skills, Agents and
  Rules rows, so the state has no items for the other two kinds; their
  chips show Figma's counts (2 and 1).
