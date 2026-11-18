# T01 deviations

What still differs from Figma after round 1 of the fidelity loop
(`pnpm fidelity toolkit T01`, 2026-11-17, against the installed library
1.0.0-beta.8), each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/toolkitListTablet.ts`: the D1 list plus the
Rules group, with writing-reviewer at →3 as T1 shows it. The numbers
below are from the run with library 1.0.0-beta.15 and the props that
library #115 added: `ViewSwitch tone="accent"` and
`FilterChips padding="none"`. A rerun with library 1.0.0-beta.26
(the-bridge #60: the tab bar lies over the page) gave the Checks of
2026-11-17. The Checks and the numbers below are from `pnpm fidelity
toolkit` on 2026-11-18, against library 1.0.0-beta.47, with the props
that library #166 added: `Card padding="compact"` with the counts as
`trailing` on each row, and `GroupHeader variant="toolkitCompact"` on
the headers.

## Checks

- Text: fail. Every Figma string is in the render. Two strings of the
  Rules rows are not visible: `releases` and `skills` lie under the tab
  bar, which lies over the list (AppShell `tabBarOverlay`), so the check
  counts them as covered. Each row is 1 px taller than Figma's and each
  header 1 px taller (see Row height), so the releases and skills row
  starts 14 px lower and its names go under the bar, where Figma's show
  above it. The ste100 and writing names and counts (428:288, 428:291,
  428:298, 428:301) lie under Figma's tab bar too; `exceptions.json`
  names them. On main (beta.47 without these props) 13 strings were not
  visible.
- Position: 21 of 38 layers pass: `header`, `read-only`,
  `view · List, Map or Activity`, `filter · chips`, `search`,
  `group · SKILLS`, the first eight rows (`toolkit row · agents-md` to
  `toolkit row · readme`) and `tab bar`, with the shared navigation's
  items (`tab · Home`, `tab · Inbox`, `tab · Workspaces`,
  `tab · Projects`, `tab · Artifacts` and `tab · More`). On main 13
  passed.
- Rules: pass. The `hiddenOverflow` finding on the scrolling detail
  (`main.app-shell__detail`) is in `exceptions.json`: Figma's list runs
  on under the pinned tab bar, as the render's does.

## Deviations

- **Row height.** Library #166 closed the row's inset and the counts'
  place (gap row Toolkit row (tablet), closed): each row is 60 px high
  against Figma's 59, with the tile 13 px in and the counts `→0 ←1`
  centred at the row's right end, as in Figma. 59 is off the 4 px grid
  (d-100). The 1 px adds up down the list, with the headers' 1 px (28
  against 27): `group · AGENTS` y +6;
  `toolkit row · diagram-reviewer` and `toolkit row · eval-case-writer`
  y +7; `toolkit row · eval-grader` and
  `toolkit row · pr-description-checker` y +8;
  `toolkit row · readme-cold-reader` y +9;
  `toolkit row · writing-reviewer` y +10; `group · RULES` y +11;
  `toolkit row · commits-and-prs` and `toolkit row · diagrams` y +12;
  `toolkit row · linear` and `toolkit row · readmes` y +13;
  `toolkit row · releases` and `toolkit row · skills` y +14;
  `toolkit row · ste100` and `toolkit row · writing` y +15.
- **Kind tile.** The row's kind tile is 28 px (`KindTile size="sm"`)
  against Figma's 30: 30 is off the 4 px grid (d-100; gap: Kind tile
  30 px).
- **Toolkit box.** Figma's `toolkit` layer (428:2) is the list's content
  box, 712 wide from x 22, and it ends at the tab bar (h 1040). The
  render's `toolkit` is the scrolling list with its 24 px sides, 756 wide
  from x 0, and as high as all its rows (`toolkit` x -22, y -12, w +44,
  h +140). The side is 24 px against Figma's 22: no space token has 22.
- **View switch.** List, Map and Activity and the Read-only badge
  before them pass the position check, and with `tone="accent"` the
  selected List item has the selected fill with no border, as in Figma.
  The switch is still 36 px high against Figma's 38, with a 2 px inset
  against 4 and 16 px icons against 15: 38 is off the 4 px grid (d-100),
  and no icon token has 15 (gap: View switch 38 px).
- **Group headers.** SKILLS, AGENTS and RULES use `GroupHeader
  variant="toolkitCompact"`: 28 px high against Figma's 27, the label
  8 under the top, as Figma's. `group · SKILLS` passes; AGENTS and RULES
  are only lower (see Row height). 27 is off the 4 px grid (d-100).
- **Workflows and Hooks.** The frame shows only the Skills, Agents and
  Rules rows, so the state has no items for the other two kinds; their
  chips show Figma's counts (2 and 1).
