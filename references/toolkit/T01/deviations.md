# T01 deviations

What still differs from Figma after round 1 of the fidelity loop
(`pnpm fidelity toolkit T01`, 2026-11-17, against the installed library
1.0.0-beta.8), each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/toolkitListTablet.ts`: the D1 list plus the
Rules group, with writing-reviewer at →3 as T1 shows it.

## Checks

- Text: fail. Every Figma string is in the render. Fourteen strings of
  the Rules rows are not visible, because the taller rows push those rows
  under the tab bar (see Row height): `rules/commits-and-prs.md`,
  `rules/diagrams.md`, `linear`, `rules/linear.md`, `→0 ←0` (428:251 and
  428:271), `readmes`, `rules/readmes.md`, `→1 ←4`, `releases`,
  `rules/releases.md`, `skills`, `rules/skills.md` and `→1 ←0`. The
  ste100 and writing names and counts (428:288, 428:291, 428:298,
  428:301) lie under Figma's tab bar too; `exceptions.json` names them.
- Position: 3 of 32 layers pass (`header`, `group · SKILLS`, `tab bar`).
- Rules: pass. The `hiddenOverflow` finding on the scrolling detail
  (`main.app-shell__detail`) is in `exceptions.json`: Figma's list runs
  on under the pinned tab bar, as the render's does.

## Deviations

- **Row height.** Each item is 72 px high against Figma's 59 (`h +13` on
  every row key). Figma's row has an 11 px inset; the library `Card` has
  16 (gap: Toolkit row (tablet)). Each row of the grid starts 13 px lower
  than the one before, and each group header 3 px lower again:
  `toolkit row · agents-md` and `toolkit row · ambitious` y +7;
  `toolkit row · audit-slop` and `toolkit row · eval-cases` y +20;
  `toolkit row · mermaid-diagrams` and `toolkit row · pr-description`
  y +33; `toolkit row · project-setup` and `toolkit row · readme` y +46;
  `group · AGENTS` y +72; `toolkit row · diagram-reviewer` and
  `toolkit row · eval-case-writer` y +75; `toolkit row · eval-grader` and
  `toolkit row · pr-description-checker` y +88;
  `toolkit row · readme-cold-reader` y +101;
  `toolkit row · writing-reviewer` y +114; `group · RULES` y +127;
  `toolkit row · commits-and-prs` and `toolkit row · diagrams` y +130;
  `toolkit row · linear` and `toolkit row · readmes` y +143;
  `toolkit row · releases` and `toolkit row · skills` y +156;
  `toolkit row · ste100` and `toolkit row · writing` y +169. Only the
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
  h +306). The side is 24 px against Figma's 22: no space token has 22.
- **View switch.** List, Map and Activity are 232.5 px wide and 36 high
  against Figma's 239 and 38 (`view · List, Map or Activity` x +4.5,
  w -6.5; gap: View switch 38 px). The Read-only badge before it moves
  right with it (`read-only` x +5.2).
- **Kind chips.** The chip row is 594 px wide and 36 high against
  Figma's 568 and 32 (`filter · chips` w +25.8): `FilterChips` pads the
  row 2 px and its labels are wider (gap: Kind chip row). The search
  below starts 6 px lower (`search` y +6).
- **Group headers.** SKILLS, AGENTS and RULES are 30 px high against
  Figma's 27 (`GroupHeader variant="sidebar"`; gap: Toolkit group
  header).
- **Tab bar.** The shared `AppTabBar` (`device="tablet"`, More selected,
  d-105) spreads its six tabs over the full width; Figma keeps them 76 px
  wide in the middle (424:3864 to 424:3899). Its box passes the position
  check; the tab places are the shared block's, which this frame does
  not change.
- **Workflows and Hooks.** The frame shows only the Skills, Agents and
  Rules rows, so the state has no items for the other two kinds; their
  chips show Figma's counts (2 and 1).

## Second review

- **Selected view.** The selected List item has a light outline; Figma
  draws only the selected fill (gap: View switch 38 px, P3).
