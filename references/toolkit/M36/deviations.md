# M36 deviations

What still differs from Figma after the fidelity loop
(`pnpm fidelity toolkit M36`, 2026-11-18, against library 1.0.0-beta.28),
each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/agentFilesPhone.ts`: T33's files
(`agentFilesTablet`) with the phone's role line for writing-reviewer.md
(its length and kind) and no `ui.from`, so the back row goes to Toolkit
with no breadcrumb, as on M20. The agent keeps M20's header (the kind badge
with when it changed, the name and the path badge with its copy button);
under the tabs the agent's folder in the toolkit and the tree with its one
file, no viewer and no row marked (`src/app/ToolkitFiles.test.tsx`, the
M35 to M38 cases). D06, D10, D33 to D36, T04, T06, T32 to T35, M22 and M12
give the same results as before M36.

## Checks

- Text: pass (20 strings checked).
- Position: 13 of 16 layers pass (`back row`, `button · map`,
  `meta row`, `kind badge`, `494:4717`, `path badge`, `toolkit/agents/`,
  `tab bar` and the five tabs of the navigation). The 3 that fail
  (`button · Discuss`, `toolkit`, `tree`) are listed below.
- Rules: fail. One `hiddenOverflow` finding: the item tabs' list
  (`[data-figma="toolkit"] > div.item-tabs__root > div.item-tabs__list`),
  see Item tabs.

## Deviations

- **Tree row.** Figma's row ends with a 14 px chevron and is 54 high;
  `FileTree` draws a file with no chevron and pads the row so the tree box
  is 12 px taller (`tree` h +12), as on M35. Gap: File tree rows.
- **Discuss button.** Figma's Discuss is an icon button 36 × 28; an
  icon-only `Button` is square, so Discuss is `sm`, 28 × 28, and starts
  8 px further right (`button · Discuss` x +8 w -8), as on M20. Gap: Item
  action buttons.
- **Item frame.** Figma's `toolkit` holds the back row and the item, from
  y 42 to the tab bar. In `DetailFrame` the back row is the ScrollFrame's
  header and the item is the body under it, so the article starts under
  the back row and is as high as its content (`toolkit` y +36, h -447),
  as on M20 (d-107).
- **Item tabs.** Activity runs past the screen's edge as in Figma; the
  compact list scrolls sideways (`hiddenOverflow` on the item tabs'
  list), as on M20 and M22. The selected tab's outline is
  `border.selected` at half alpha (no solid selected token, d-050).
- **Kind badge.** Figma draws the Agent label in the agent colour;
  `KindBadge` draws it dimmer, within the position check. Gap: Kind badge
  outline.
- **Copy icon.** The path badge's copy icon is a plain button with
  `CopyIcon`, as on M20. Gap: Path badge copy button.
